# SkillSwap AI 🚀
### *Intelligent Peer-to-Peer Learning & AI-Powered Roadmaps*

SkillSwap AI is a modern web application designed to connect learners and teachers dynamically. Users can trade skills, participate in AI-generated learning roadmaps, take skill-assessment quizzes, and collaborate on real-time projects.

🌐 **Live Website**: [https://skillswap-frontend-1gv8.onrender.com](https://skillswap-frontend-1gv8.onrender.com)

---

## 🌟 Key Features

*   **Intelligent Match Center**: Discover peer learners looking for skills you teach, and vice-versa.
*   **AI Roadmaps**: Instantly generate structured, step-by-step learning roadmaps for any topic (powered by Google Gemini AI).
*   **Interactive Quiz Center**: Test your knowledge on various domains and track your learning progress.
*   **Real-time Collaboration**: Chat dynamically with peers, create group projects, and share knowledge in peer forums.
*   **Leaderboard**: Track your learning milestones, earn badges, and rank up against other community members.
*   **Secure Recovery Flow**: Fully automated 6-digit OTP password recovery emails integrated directly with Brevo REST API.
*   **Responsive Mobile Layout**: Elegant, native-like mobile slide-out drawer menu for fluid on-the-go navigation.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js (TypeScript, React, TailwindCSS, Lucide Icons)
*   **Backend**: FastAPI (Python, MongoDB Motor Driver)
*   **Database**: MongoDB Atlas (NoSQL cloud database)
*   **AI Integration**: Google Generative AI (Gemini SDK)
*   **Email Deliverability**: Brevo REST HTTP API (HTTPS port 443)

---

## 📦 Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/DEVDARJI7730/skillswap-ai.git
cd skillswap-ai
```

### 2. Backend Configuration
Navigate to the `backend` folder and set up a virtual environment:
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder and populate it:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname
DB_NAME=skillswap
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key

# Email Settings (Brevo API Integration)
BREVO_API_KEY=xkeysib-your-brevo-api-key
BREVO_SENDER_EMAIL=your-sender-email@domain.com
```

Run the backend:
```bash
python -m uvicorn app.main:app --reload
```

---

### 3. Frontend Configuration
Navigate to the `frontend` folder and install dependencies:
```bash
cd ../frontend
npm install
```

Create a `.env.local` file inside the `frontend` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend in development mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in your browser!

---

## 🔒 Security & Git Notice
The `.env` files are added to the `.gitignore` configuration and are excluded from version tracking. Please never commit secret credentials to your public GitHub repository. For production builds, configure these secrets within the Render Environment variables tab.
