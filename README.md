# AI-Powered Pet Care & Adoption Portal

This workspace is structured as two independent apps:

- `frontend`: Next.js (App Router, TypeScript, Tailwind)
- `backend`: Express.js + MongoDB API

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.
Backend runs at `http://localhost:5000`.

## Initial Health Check

Open:

- `http://localhost:5000/api/v1/health`
