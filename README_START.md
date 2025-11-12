# Quick Start Guide

**For complete documentation, see [README.md](./README.md)**

## 🚀 Fastest Way to Start

### Using Startup Scripts (Recommended)

```bash
# Start all services
./start-services.sh

# Stop all services
./stop-services.sh
```

This will start:
- AI Service on http://localhost:8000
- Backend API on http://localhost:3000
- Frontend on http://localhost:5173

## 📋 Prerequisites Checklist

- [ ] Node.js (v14+) installed
- [ ] PostgreSQL installed and running
- [ ] Python 3.8+ installed
- [ ] Database created: `createdb skillmatch`

## ⚡ Quick Setup Steps

### 1. Database Setup
```bash
cd backend
# Create .env file with DATABASE_URL
npx prisma migrate dev
```

### 2. Backend
```bash
cd backend
npm install
npm start
```

### 3. AI Service
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn resume_match_service:app --host 0.0.0.0 --port 8000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔗 Service URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **AI Service:** http://localhost:8000

## ✅ Health Checks

```bash
# AI Service
curl http://localhost:8000/health

# Backend
curl http://localhost:3000
```

## 🐛 Common Issues

**Port in use?**
```bash
lsof -i :8000  # Find process
kill -9 <PID>  # Kill it
```

**Database connection error?**
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`

**AI service not starting?**
- Activate venv: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`
- Download spaCy: `python -m spacy download en_core_web_sm`

---

**For detailed setup, troubleshooting, and features, see [README.md](./README.md)**
