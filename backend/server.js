// ================================
// BACKEND API SETUP (server.js)
// ================================

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

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
  const redirectURL = `https://api14.unipile.com:14433/v1/users/connect?redirect_uri=${process.env.LINKEDIN_CALLBACK_URL}&provider=linkedin`;
  res.redirect(redirectURL);
});

// Handle OAuth callback
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    // Exchange code for access token with Unipile
    const response = await axios.post('https://api14.unipile.com:14433/v1/users/connect', {
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
    const response = await axios.get('https://api14.unipile.com:14433/v1/users/me', {
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
    const response = await axios.post('https://api14.unipile.com:14433/v1/messages', {
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

