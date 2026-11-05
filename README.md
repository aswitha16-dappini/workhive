# 🐝 WorkHive – Freelancing & Escrow Collaboration Platform

WorkHive is a modern full-stack MERN freelancing marketplace and project collaboration platform. It empowers clients to post milestone projects and hire elite talent, while enabling freelancers to submit competitive bids, collaborate securely, and receive milestone payouts through simulated escrow protection.

---

## 🌟 Key Features

### 🔐 Module 1 – Authentication & User Management
- Separate **Client** and **Freelancer** registration & login with role-based routing.
- JWT token-based authentication with resilient localStorage persistence.
- Live role-based access control (RBAC) guards protecting private API endpoints.
- Quick 1-click **Demo Accounts** for instant marketplace exploration.

### 👤 Module 2 – Freelancer & Client Profiles
- **Freelancer Profiles:** Professional title, bio, categorized skill tags, hourly rate, rating, education, and portfolio links.
- **Client Profiles:** Company name, industry, location, website, hiring requirements, and live statistics.
- Dynamic profile completion indicator with actionable booster steps.

### 💼 Phase 2 & Module 3 – Marketplace & Project Management
- **10 Core Categories:** Web Development, Mobile Apps, UI/UX Design, Graphic Design, Data Analytics, AI & ML, Content Writing, Digital Marketing, DevOps & Cloud, and Video Editing.
- Project creation with min/max budget range, estimated duration, and skill requirements.
- Full-text search and category filtering across all public job listings.

### 🛡️ Simulated Escrow Milestones & Deliverables
- Proposal bidding with custom proposed bid, delivery timeline, and cover letter.
- Client proposal acceptance automatically initializes and locks funds in simulated Escrow.
- Multi-milestone pipeline with deliverable work submissions (code links, staging notes).
- Client review and approval releases funds to the freelancer and completes contracts.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, Axios, Modern Responsive CSS |
| **Backend** | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, CORS |
| **Database** | MongoDB Atlas (Cloud Cluster) |
| **Deployment** | Vercel (Frontend SPA) + Render (Backend Web Service) |

---

## 📁 Repository Structure

```
WORKHIVE/
├── client/                     # Frontend (React 19 + Vite SPA)
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProtectedRoute, etc.
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── pages/              # Dashboards, Marketplace, Projects, Profiles, Auth
│   │   ├── services/           # Axios API service layer
│   │   └── utils/              # Category metadata and title helpers
│   ├── vercel.json             # Vercel SPA rewrite configuration
│   ├── .env.example            # Client environment variable template
│   └── package.json
│
├── server/                     # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/             # MongoDB Atlas connection (Mongoose)
│   │   ├── controllers/        # Auth, Projects, Proposals, Milestones, Profiles, Stats
│   │   ├── middleware/         # JWT protection & role authorization
│   │   ├── models/             # User, Project, Proposal, Milestone, Profiles
│   │   ├── routes/             # REST API endpoint routes
│   │   ├── utils/              # Token generation and safe title utilities
│   │   └── server.js           # Express app initialization & CORS configuration
│   ├── .env.example            # Server environment variable template
│   └── package.json
│
├── .gitignore                  # Excludes .env, node_modules, build outputs, and secrets
├── package.json                # Coordinated workspace scripts
└── README.md
```

---

## 🚀 Local Development Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/workhive.git
cd workhive
npm run install:all
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/workhive?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
```

**Frontend (`client/.env` - optional in dev):**
```env
# In development, leave blank to use the Vite local proxy (/api -> localhost:5000)
VITE_API_URL=/api
```

### 3. Run Development Servers

```bash
# Terminal 1: Backend API (port 5000)
npm run server

# Terminal 2: Frontend Vite App (port 5173)
npm run client
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Production Deployment Guide

### A. Backend Deployment (Render)

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add the following **Environment Variables** in Render Dashboard:
   - `PORT`: `5000` (or leave default assigned by Render)
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/workhive?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<secure-random-string>`
   - `CLIENT_URL`: `https://your-workhive-frontend.vercel.app`
5. Click **Deploy Web Service** and note your backend URL (e.g., `https://workhive-backend.onrender.com`).

---

### B. Frontend Deployment (Vercel)

1. Import your GitHub repository on [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add the following **Environment Variable** in Vercel Dashboard:
   - `VITE_API_URL`: `https://your-workhive-backend.onrender.com/api`
4. Click **Deploy**. Vercel will build the frontend and serve it with seamless SPA routing via `client/vercel.json`.

---

## 🛡️ Security & Best Practices

- **Zero Hardcoded Secrets:** All credentials, database URIs, and JWT signing keys are loaded strictly from environment variables.
- **Git Protection:** `.env` and sensitive files are globally excluded via `.gitignore`.
- **CORS Protection:** Express backend restricts origins to authorized clients and dynamic Vercel domains.
- **Password Protection:** User passwords are encrypted with bcryptjs (salt rounds: 10) and excluded from default queries (`select: false`).
- **Simulated Escrow:** WorkHive escrow transfers are safe simulations designed for verified talent marketplace workflows.

---

## 📄 License
This project is licensed under the ISC License.
