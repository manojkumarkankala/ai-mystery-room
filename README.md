# AI Mystery Room

A full-stack AI detective game built with React, Vite, Tailwind CSS, Express, MongoDB, Mongoose, Zod, and Gemini.

## Requirements
- Node.js 20 or newer
- MongoDB Atlas database (or local MongoDB)
- Gemini API key

## 1. Configure the backend

```powershell
cd server
Copy-Item .env.example .env
npm install
```

Edit `server/.env` and set:
- `MONGODB_URI`
- `GEMINI_API_KEY`
- `CLIENT_URL=http://localhost:5173`

## 2. Configure the frontend

```powershell
cd ../client
Copy-Item .env.example .env
npm install
```

For local development, `client/.env` should contain:
`VITE_API_URL=http://localhost:5000/api`

## 3. Run locally

Open two terminals.

Terminal 1:
```powershell
cd server
npm run dev
```

Terminal 2:
```powershell
cd client
npm run dev
```

Open http://localhost:5173

Health check: http://localhost:5000/api/health

## Deploy

### Backend (Render)
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_URL` (your deployed Vercel URL), `NODE_ENV=production`

### Frontend (Vercel)
- Root directory: `client`
- Framework: Vite
- Environment variable: `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`

After deployment, ensure `CLIENT_URL` exactly matches the frontend origin.

## Security note
This is an educational MVP without user authentication or case ownership. Add authentication, ownership checks, rate limiting, and abuse protection before production use. Never commit `.env` files.
