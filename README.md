# Online Chat MVP

A simple full-stack chat app with group chat, direct messages, and an admin panel.

## Features
- Group chat with members and messages
- Direct messages between users
- Admin tools for groups and member moderation
- Profile editing

## Tech Stack
- Backend: FastAPI + SQLAlchemy (SQLite)
- Frontend: React + Vite + Tailwind CSS

## Requirements
- Python 3.10+
- Node.js 18+

## Run Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000`.
To change it, set `VITE_API_URL` in `frontend/.env`.

## Default Admin
On first start, a default admin is created if it does not exist:
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin12345`

You can override these with env vars:
`ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
