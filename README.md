<!-- Animated Header -->
<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=FFFFFF&size=22&center=false&vCenter=true&width=500&lines=AI-powered+LinkedIn+Outreach+Tool;Generate+and+Send+Messages+Effortlessly" />

<h1>LinkedIn Outreach AI Tool</h1>

<p>
A full-stack AI-based outreach assistant that connects with a LinkedIn profile using OAuth, fetches profile data, generates a personalized message using Google’s Gemini model, and sends it via LinkedIn messaging through the Unipile API.
</p>

<hr/>

<h2>Features</h2>
<ul>
  <li>LinkedIn authentication using OAuth via Unipile</li>
  <li>Fetches real-time LinkedIn profile details</li>
  <li>Generates AI-based personalized outreach message</li>
  <li>Sends message directly through LinkedIn (Unipile API)</li>
  <li>Simple UI with status handling and copy-to-clipboard</li>
</ul>

<hr/>

<h2>Technology Stack</h2>

<h3>Frontend</h3>
<ul>
  <li>React (with Vite)</li>
  <li>Tailwind CSS and Shadcn UI</li>
</ul>

<h3>Backend</h3>
<ul>
  <li>Node.js and Express</li>
  <li>OAuth with Passport.js (LinkedIn strategy)</li>
  <li>Google Generative AI (Gemini 1.5 Flash) for message generation</li>
  <li>Unipile API for LinkedIn account access and messaging</li>
</ul>

<hr/>

<h2>About the APIs</h2>

<h3>Unipile API</h3>
<p>
Unipile provides unified access to messaging platforms like LinkedIn via its REST API. This tool uses it for:
<ul>
  <li>Authenticating users via LinkedIn (OAuth)</li>
  <li>Fetching user profile data (name, username, LinkedIn ID)</li>
  <li>Sending outreach messages directly through LinkedIn</li>
</ul>
</p>

<h3>LinkedIn OAuth</h3>
<p>
OAuth is used to authenticate the user via LinkedIn through Unipile. Once authenticated, the app retrieves a JWT and LinkedIn user ID, which is stored in local storage for further secure API calls.
</p>

<h3>Gemini API (Google Generative AI)</h3>
<p>
The backend uses Gemini (via GoogleGenerativeAI SDK) to generate personalized outreach messages. The message prompt is tailored based on the LinkedIn profile data.
</p>

<hr/>

<h2>Setup Instructions</h2>

<h3>1. Clone the repository</h3>
<pre>
git clone https://github.com/your-username/linkedin-outreach-ai.git
cd linkedin-outreach-ai
</pre>

<h3>2. Backend Setup</h3>
<pre>
cd backend
npm install
</pre>

<h4>.env file:</h4>
<pre>
PORT=5000
FRONTEND_URL=http://localhost:5173
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:5000/auth/linkedin/callback
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
UNIPILE_BASE_URL=https://api.unipile.com
UNIPILE_API_KEY=your_unipile_api_key
GEMINI_API_KEY=your_gemini_api_key
</pre>

<pre>
npm start
</pre>

<h3>3. Frontend Setup</h3>
<pre>
cd frontend
npm install
npm run dev
</pre>

<hr/>

<h2>How It Works</h2>
<ol>
  <li>User clicks "Connect with LinkedIn" → OAuth flow via Unipile</li>
  <li>Token and user ID are saved in local storage</li>
  <li>User profile is fetched from Unipile API</li>
  <li>Message is generated using Gemini AI</li>
  <li>Message is sent via Unipile’s messaging endpoint</li>
</ol>

<hr/>

<h2>License</h2>
<p>MIT License</p>
