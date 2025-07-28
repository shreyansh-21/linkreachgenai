// ================================
// BACKEND API SETUP (server.js)
// ================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI client

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ================================
// 1. LINKEDIN OAUTH ROUTES
// ================================

// Start LinkedIn OAuth
app.get('/auth/linkedin', (req, res) => {
  const authUrl = `https://api.unipile.com/v1/users/connect`;
  res.json({ authUrl });
});

// Handle OAuth callback
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    // Exchange code for access token with Unipile
    const response = await axios.post('https://api.unipile.com/v1/users/connect', {
      code,
      provider: 'linkedin',
      redirect_uri: process.env.REDIRECT_URI
    }, {
      headers: {
        'X-API-KEY': process.env.UNIPILE_API_KEY
      }
    });

    const { access_token, user_id } = response.data;
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}?token=${access_token}&user_id=${user_id}`);
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
});

// ================================
// 2. PROFILE API ROUTE
// ================================

app.get('/api/profile', async (req, res) => {
  try {
    const { authorization } = req.headers;
    const token = authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Fetch profile from Unipile
    const response = await axios.get('https://api.unipile.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-KEY': process.env.UNIPILE_API_KEY
      }
    });

    const profile = {
      name: response.data.name,
      jobTitle: response.data.job_title,
      company: response.data.company,
      industry: response.data.industry,
      profilePicture: response.data.profile_picture
    };

    res.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ================================
// 3. AI MESSAGE GENERATION ROUTE
// ================================

app.post('/api/generate-message', async (req, res) => {
  try {
    const { profile } = req.body;

    const prompt = `Write a professional LinkedIn outreach message to ${profile.name} who works as ${profile.jobTitle} at ${profile.company} in the ${profile.industry} industry.

Keep it:
- Under 100 words
- Professional but friendly
- Focused on potential collaboration
- No pushy sales language

Just return the message, no extra formatting.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const message = response.text();

    res.json({ message });
  } catch (error) {
    console.error('Gemini error:', error.message);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

// ================================
// 4. SEND MESSAGE ROUTE
// ================================

app.post('/api/send-message', async (req, res) => {
  try {
    const { message, recipientId } = req.body;
    const { authorization } = req.headers;
    const token = authorization?.split(' ')[1];

    // Send message via Unipile
    const response = await axios.post('https://api.unipile.com/v1/messages', {
      provider: 'linkedin',
      recipient_id: recipientId,
      text: message
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-KEY': process.env.UNIPILE_API_KEY
      }
    });

    res.json({ success: true, messageId: response.data.id });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ================================
// FRONTEND API INTEGRATION (api.js)
// ================================

// Create this file in your React src folder
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('access_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  // 1. Start LinkedIn OAuth
  async startLinkedInAuth() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/linkedin`);
      const data = await response.json();
      
      // Redirect user to LinkedIn OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Auth start error:', error);
      throw new Error('Failed to start authentication');
    }
  }

  // 2. Fetch user profile
  async fetchProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  // 3. Generate AI message
  async generateMessage(profile) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-message`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ profile })
      });

      if (!response.ok) {
        throw new Error('Failed to generate message');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Message generation error:', error);
      throw error;
    }
  }

  // 4. Send message
  async sendMessage(message, recipientId = 'default') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/send-message`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message, recipientId })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }
}

export default new ApiService();
