# Pocket C.A. — AI-Powered Accounting Assistant

<div align="center">

![Pocket C.A. Banner](https://img.shields.io/badge/Pocket%20C.A.-AI%20Finance%20Assistant-6366f1?style=for-the-badge&logo=react)

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/atlas)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%20API-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)

**Your intelligent personal finance companion — powered by AI.**

[Features](#features) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Installation](#installation) · [API Docs](#api-reference) · [Roadmap](#roadmap)

</div>

---

## 📖 Project Description

**Pocket C.A.** (Pocket Chartered Accountant) is a full-stack, AI-powered personal finance web application that helps users track income and expenses, manage budgets, set savings goals, and get real-time accounting guidance through a conversational AI assistant powered by Google Gemini.

Designed as a capstone project for software engineering portfolios, Pocket C.A. demonstrates professional-grade architecture, clean code principles, and real-world AI integration.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🔐 **Authentication** | Secure JWT-based register/login with bcrypt password hashing |
| 💰 **Transactions** | Full CRUD — track income & expenses with categories, filters, and CSV export |
| 📊 **Budgets** | Monthly category budgets with real-time utilization tracking and alerts |
| 🎯 **Goals** | Savings goal tracking with contribution history and progress visualization |
| 🤖 **AI Chat** | Conversational assistant (Gemini) with personalized financial context |
| 📄 **Receipt OCR** | Upload receipts — AI extracts and pre-fills transaction details |
| 📈 **Reports** | Visual dashboards — Bar, Donut, and Line charts via Recharts |
| 👤 **Profile** | Currency preferences, password management, account settings |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Vercel)                         │
│              React.js SPA + TailwindCSS                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST API
┌──────────────────────────▼──────────────────────────────────┐
│                    SERVER (Render)                          │
│           Node.js + Express.js REST API                     │
│    Middlewares: CORS │ Helmet │ Rate Limiter │ JWT Auth     │
└──────────┬───────────────────────────────┬──────────────────┘
           │                               │
┌──────────▼──────────┐        ┌───────────▼──────────────────┐
│   MongoDB Atlas     │        │   Google Gemini API          │
│   (Database)        │        │   (AI / Vision)              │
└─────────────────────┘        └──────────────────────────────┘
```

**Pattern**: Layered N-Tier Architecture (Presentation → Controller → Service → Data Access → DB)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI library |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| React Router DOM | 6.x | Client-side routing |
| Axios | 1.x | HTTP client with interceptors |
| Recharts | 2.x | Financial charts (Bar, Pie, Line) |
| Lucide React | Latest | Modern icon library |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x | JavaScript runtime |
| Express.js | 4.x | Web framework |
| MongoDB | Atlas | Cloud NoSQL database |
| Mongoose | 8.x | MongoDB ODM |
| JWT | 9.x | Stateless authentication |
| bcryptjs | 2.x | Password hashing |
| Helmet | 7.x | HTTP security headers |
| Morgan | 1.x | HTTP request logger |
| Multer | 1.x | File upload handling |
| Google Generative AI | Latest | Gemini AI SDK |

---

## 📁 Folder Structure

```
Pocket-CA/
├── frontend/                   # React + Vite SPA
│   ├── public/
│   └── src/
│       ├── assets/             # Static files (images, SVGs)
│       ├── components/
│       │   ├── common/         # Reusable UI components
│       │   ├── layout/         # Navbar, Sidebar, Footer
│       │   └── charts/         # Recharts wrappers
│       ├── pages/              # Route-level page components
│       ├── hooks/              # Custom React hooks
│       ├── context/            # React Context providers
│       ├── services/           # Axios API service modules
│       ├── utils/              # Helper functions
│       ├── constants/          # Enums, categories, routes
│       ├── routes/             # React Router configuration
│       └── styles/             # Global CSS
│
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/             # DB, environment, Gemini config
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic layer
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express route definitions
│   │   ├── middlewares/        # Auth, validation, error handler
│   │   ├── validators/         # Joi validation schemas
│   │   └── utils/              # Helpers, error classes
│   ├── uploads/                # Temporary receipt storage
│   ├── app.js                  # Express app configuration
│   └── server.js               # Entry point
│
├── README.md
└── .gitignore
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier)
- Google Gemini API key (free tier)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/pocket-ca.git
cd pocket-ca
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 4. Environment Variables

**Backend `.env`**:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pocket-ca
JWT_SECRET=your_super_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend `.env`**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🔌 API Reference

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://pocket-ca-api.onrender.com/api`

### Health Check
```http
GET /api/health
```
```json
{ "success": true, "message": "Pocket C.A. API Running" }
```

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, receive JWT |
| `GET` | `/auth/me` | Get current user (🔒) |
| `PUT` | `/auth/profile` | Update profile (🔒) |
| `PUT` | `/auth/change-password` | Change password (🔒) |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/transactions` | List with filters/pagination (🔒) |
| `POST` | `/transactions` | Create transaction (🔒) |
| `GET` | `/transactions/:id` | Get single transaction (🔒) |
| `PUT` | `/transactions/:id` | Update transaction (🔒) |
| `DELETE` | `/transactions/:id` | Delete transaction (🔒) |
| `GET` | `/transactions/summary` | Financial summary (🔒) |
| `GET` | `/transactions/export/csv` | CSV export (🔒) |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/budgets` | List budgets (🔒) |
| `POST` | `/budgets` | Create budget (🔒) |
| `PUT` | `/budgets/:id` | Update budget (🔒) |
| `DELETE` | `/budgets/:id` | Delete budget (🔒) |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/goals` | List goals (🔒) |
| `POST` | `/goals` | Create goal (🔒) |
| `PUT` | `/goals/:id` | Update goal (🔒) |
| `DELETE` | `/goals/:id` | Delete goal (🔒) |
| `POST` | `/goals/:id/contribute` | Log contribution (🔒) |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/chat` | Chat with AI assistant (🔒) |
| `GET` | `/ai/chat/history` | Get chat history (🔒) |
| `DELETE` | `/ai/chat/history` | Clear chat history (🔒) |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload/receipt` | Extract receipt via AI (🔒) |

> 🔒 = Requires `Authorization: Bearer <token>` header

---

## 🛡️ Production Security & Performance Hardening
Pocket C.A. implements rigorous defense-in-depth security and performance optimizations:
- **Content Security Policy (CSP) & Helmet**: Strict HTTP response headers protecting against XSS, clickjacking, and MIME-sniffing.
- **HTTP Compression**: Gzip/Brotli payload compression enabled via `compression` middleware for sub-50ms API responses.
- **Rate Limiting**: Multi-tiered rate limiters protecting authentication endpoints (`/api/auth`), AI chat generation (`/api/ai`), and general REST APIs against brute-force and DDoS attacks.
- **Data Isolation**: Strict ownership validation at the database and controller layers ensuring users can never query, modify, or infer another user's financial metrics or OCR data.
- **Input Validation & Sanitization**: Strict Joi schemas and MongoDB query sanitization against NoSQL injection.

---

## 🧪 Master Verification & Testing Suite
Pocket C.A. features a standalone, zero-config automated regression suite covering all 8 phases of development:

```bash
# Execute master regression runner across all 8 suites
node run_all_tests.js
```

### Test Architecture
- **In-Memory Isolation**: Uses `MongoMemoryServer` to spin up ephemeral, in-memory MongoDB instances per suite on isolated ports (5001–5008), preventing database pollution and port contention.
- **100% Automated Coverage**: Verifies JWT authentication guards, NoSQL isolation, NoSQL filtering, AI budget calculations, OCR heuristic parsing, PDF/Excel buffer stream headers (`%PDF-` and `PK`), and rate limit enforcement.
- **MongoDB Atlas Production Smoke Test**: Includes `scratch/test_atlas_smoke.js`, which tests live connection latency and CRUD persistence against real MongoDB Atlas Free Tier clusters.

---

## 🐳 Containerization & Deployment

### 1. Docker Compose (Local & Production Orchestration)
Run the complete backend stack and local MongoDB container with zero setup:
```bash
docker-compose up --build -d
```
The application will be available at `http://localhost:5000` with automated health checks (`/api/health`) and non-root container security (`pocketuser`).

### 2. Frontend Deployment (Vercel)
The frontend is configured with `frontend/vercel.json` for SPA routing and asset caching:
1. Connect your GitHub repository to Vercel.
2. Set Build Command: `npm run build` | Output Directory: `dist`.
3. Add Environment Variable: `VITE_API_BASE_URL=https://your-render-backend.onrender.com/api`.

### 3. Backend Deployment (Render)
The backend is configured with `backend/render.yaml` for automated infrastructure-as-code deployment:
1. Connect your GitHub repository to Render as a Blueprint.
2. Set Environment Variables in Render Dashboard (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `FRONTEND_URL`).
3. Render automatically uses the multi-stage `backend/Dockerfile` and monitors `/api/health`.

---

## 📅 Completed Roadmap (Phases 1–8)

### ✅ Phase 1 — Project Foundation & Authentication
- [x] Layered N-Tier architecture and folder structure
- [x] Security-first JWT authentication (`/register`, `/login`, `/me`) with bcrypt hashing

### ✅ Phase 2 — Transaction Management
- [x] Full CRUD operations with category tagging and payment methods
- [x] Advanced filtering, sorting, pagination, and NoSQL injection protection

### ✅ Phase 3 — Dashboard & Analytics
- [x] Aggregated financial summaries (Income, Expense, Net Balance)
- [x] 6-month chronological spending trends and category percentage breakdown

### ✅ Phase 4 — AI Accounting Assistant
- [x] Conversational financial analysis powered by Google Gemini API
- [x] 50/30/20 budget recommendations and comparative spending insights
- [x] AI rate limiting (10 requests / 15 min) and strict user data privacy

### ✅ Phase 5 — OCR Receipt Scanner
- [x] Image receipt upload (JPG, PNG, WEBP) with 5MB size validation
- [x] Tesseract.js OCR integration with intelligent heuristic parsing (Merchant, Tax, Date, Amount)
- [x] One-click transaction confirmation from scanned receipt data

### ✅ Phase 6 — Reports & Data Export
- [x] Comprehensive date-range financial reporting
- [x] Professional PDF statement generation with table formatting
- [x] Multi-sheet Excel workbook export (`.xlsx`) via ExcelJS

### ✅ Phase 7 — Budgets, Savings Goals & Insights
- [x] Monthly category budgets with dynamic percentage utilization tracking
- [x] Savings goals with contribution logging and automated goal completion
- [x] AI-powered financial health score (0–100) and actionable guidance

### ✅ Phase 8 — Production Hardening, Containerization & Verification
- [x] Global 3D glassmorphic Toast notification system
- [x] Multi-stage Docker containerization with non-root security and health checks
- [x] Render (`render.yaml`) and Vercel (`vercel.json`) production deployment configuration
- [x] Master verification runner (`run_all_tests.js`) achieving 100% automated regression pass rate

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Built with ❤️ as a capstone project demonstrating full-stack development with AI integration.

---

<div align="center">
  <strong>⭐ Star this repo if you find it useful!</strong>
</div>
