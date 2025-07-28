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
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY;
const UNIPILE_BASE_URL = process.env.UNIPILE_BASE_URL; // example: https://api14.unipile.com:14433
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// ================================
// 1. PROFILE API ROUTE
// ================================
app.get('/api/profile', async (req, res) => {
  try {
    const response = await axios.get(`${UNIPILE_BASE_URL}/api/v1/users/me`, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
      }
    });

    const data = response.data;

    const profile = {
      name: data.name,
      jobTitle: data.job_title,
      company: data.company,
      industry: data.industry,
      profilePicture: data.profile_picture,
    };

    res.json({ profile });
  } catch (error) {
    console.error('❌ Profile fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ================================
// 2. AI MESSAGE GENERATION (Gemini)
// ================================
app.post('/api/generate-message', async (req, res) => {
  try {
    const { profile } = req.body;

    const prompt = `Write a professional LinkedIn outreach message to ${profile.name}, who works as a ${profile.jobTitle} at ${profile.company} in the ${profile.industry} industry.

Keep it:
- Under 100 words
- Professional but friendly
- Focused on potential collaboration
- Avoid pushy language

Return just the message.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    res.json({ message: text });
  } catch (error) {
    console.error('❌ Gemini error:', error.message);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

// ================================
// 3. SEND MESSAGE ROUTE (Unipile)
// ================================
app.post('/api/send-message', async (req, res) => {
  try {
    const { message, recipientId } = req.body;

    const response = await axios.post(`${UNIPILE_BASE_URL}/api/v1/messages`, {
      provider: 'linkedin',
      recipient_id: recipientId,
      text: message
    }, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY
      }
    });

    res.json({ success: true, messageId: response.data.id });
  } catch (error) {
    console.error('❌ Send message error:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ================================
// 4. ROOT CHECK
// ================================
app.get('/', (req, res) => {
  res.send('💡 Server is running');
});

// ================================
// 5. START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
