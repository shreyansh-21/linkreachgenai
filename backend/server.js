// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import jwt from 'jsonwebtoken';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// ✅ Session setup for passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ✅ Passport LinkedIn strategy
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ['r_liteprofile', 'r_emailaddress'],
    },
    function (accessToken, refreshToken, profile, done) {
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value || '',
      };
      return done(null, user);
    }
  )
);

// ✅ LinkedIn Auth Routes
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: true }));

app.get(
  '/auth/linkedin/callback',
  passport.authenticate('linkedin', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}?error=linkedin_auth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user;
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.displayName,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Redirect with token and userId
      return res.redirect(
        `${process.env.FRONTEND_URL}?token=${token}&user_id=${user.id}`
      );
    } catch (err) {
      console.error('LinkedIn callback error:', err.message);
      return res.redirect(`${process.env.FRONTEND_URL}?error=callback_failed`);
    }
  }
);

// ✅ Protected Route Example: Profile
app.get("/api/profile", async (req, res) => {
  try {
    const accountId = "Pqm7m98oStqEFVUnMRYyug";

    const response = await axios.get(
      `${process.env.UNIPILE_BASE_URL}/api/v1/accounts/${accountId}`,
      {
        headers: {
          "X-API-KEY": process.env.UNIPILE_API_KEY,
          "Accept": "application/json"
        }
      }
    );

    const profile = response.data;

    // Log to confirm structure
    console.log("✅ Unipile raw response:", profile);

    // ✅ Correct check: type instead of provider
    if (!profile || profile.type?.toLowerCase() !== "linkedin") {
      return res.status(404).json({ error: "LinkedIn profile not found." });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        username: profile.connection_params?.im?.username || "Unknown",
        publicIdentifier: profile.connection_params?.im?.publicIdentifier || null,
        linkedInId: profile.connection_params?.im?.id || null
      }
    });

  } catch (error) {
    console.error("❌ Error fetching profile from Unipile:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});



// ✅ Send Message
app.post('/api/send-message', async (req, res) => {
  const { message, recipientId } = req.body;

  try {
    const response = await axios.post(
      `${process.env.UNIPILE_BASE_URL}/api/v1/messages`,
      {
        content: message,
        recipientId,
      },
      {
        headers: {
          'X-API-KEY': process.env.UNIPILE_API_KEY,
          Accept: 'application/json',
        },
      }
    );

    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error('Message sending error:', err.message);
    res.status(500).json({ error: 'Message send failed' });
  }
});

// ✅ Gemini Message Generation
app.post('/api/generate-message', async (req, res) => {
  const { prompt } = req.body;

  try {
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    const message = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ message });
  } catch (err) {
    console.error('Gemini generation failed:', err.message);
    res.status(500).json({ error: 'AI message generation failed' });
  }
});

// ✅ Root
app.get('/', (req, res) => {
  res.send('🚀 Server is running');
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
