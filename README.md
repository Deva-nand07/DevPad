# DevPad — Code. Note. Focus. Create.

A full-stack authenticated coding workspace that combines a code editor, notes panel, and code execution in one place.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React.js | 19.x |
| Routing | React Router DOM | 6.x |
| Build Tool | Vite | 8.x |
| Backend | Node.js + Express | 5.x |
| Database | MongoDB + Mongoose | 9.x |
| Auth | JWT + bcryptjs | - |
| Code Execution | Judge0 CE (public API) | - |
| Editor | CodeMirror 6 | - |

## Features

- **Code Editor** — Syntax highlighting for JavaScript, Python, C++, Java via CodeMirror 6
- **Code Execution** — Runs code via Judge0 CE sandboxed API, no API key required
- **Notes Panel** — Markdown-style notes saved to MongoDB, manual save with smart upsert
- **Auth** — JWT-based login/register, Remember Me, OTP password reset (no email config needed)
- **Dark/Light Mode** — Persisted via localStorage
- **Export HTML** — Snapshot of workspace with Prism.js syntax highlighting

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

### Server Setup
```bash
cd server
npm install
# Edit .env — set MONGO_URI and JWT_SECRET
npm run dev        # starts on port 5000
```

### Client Setup
```bash
cd client
npm install
npm run dev        # starts on port 5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`.

## Password Reset (OTP)

No email configuration required. When a user clicks "Forgot Password":
1. Enter registered email → server generates a 6-digit OTP stored in MongoDB (10 min expiry)
2. OTP is displayed on screen — user copies it into the input field
3. OTP verified → user sets a new password

## Environment Variables (server/.env)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/devpad
JWT_SECRET=your_secret_key_here
```
