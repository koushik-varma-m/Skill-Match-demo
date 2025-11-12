#!/bin/bash

# SkillMatch Application Startup Script
# This script starts all services required for the application

echo "========================================="
echo "Starting SkillMatch Application Services"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if directories exist
if [ ! -d "ai-service" ]; then
    echo -e "${RED}Error: ai-service directory not found${NC}"
    exit 1
fi

if [ ! -d "backend" ]; then
    echo -e "${RED}Error: backend directory not found${NC}"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo -e "${RED}Error: frontend directory not found${NC}"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Check if ports are already in use
echo -e "${YELLOW}Checking if ports are available...${NC}"
if check_port 8000; then
    echo -e "${RED}Port 8000 is already in use (AI Service)${NC}"
    exit 1
fi

if check_port 3000; then
    echo -e "${RED}Port 3000 is already in use (Backend)${NC}"
    exit 1
fi

if check_port 5173; then
    echo -e "${YELLOW}Port 5173 is already in use (Frontend) - this is OK if Vite is already running${NC}"
fi

# Start AI Service (FastAPI)
echo -e "${GREEN}Starting AI Service (FastAPI) on port 8000...${NC}"
cd ai-service
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate

if [ ! -f "venv/bin/uvicorn" ]; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
fi

echo -e "${GREEN}Starting uvicorn server...${NC}"
uvicorn resume_match_service:app --host 0.0.0.0 --port 8000 > ../logs/ai-service.log 2>&1 &
AI_PID=$!
echo -e "${GREEN}AI Service started (PID: $AI_PID)${NC}"
cd ..

# Wait a bit for AI service to start
sleep 3

# Start Backend (Node.js)
echo -e "${GREEN}Starting Backend (Node.js) on port 3000...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}Starting backend server...${NC}"
npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
cd ..

# Wait a bit for backend to start
sleep 3

# Start Frontend (React/Vite)
echo -e "${GREEN}Starting Frontend (React/Vite) on port 5173...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}Starting Vite dev server...${NC}"
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"
cd ..

# Create logs directory if it doesn't exist
mkdir -p logs

# Save PIDs to file for easy stopping
echo $AI_PID > logs/ai-service.pid
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}All services started successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Service URLs:"
echo "  - AI Service:    http://localhost:8000"
echo "  - Backend API:   http://localhost:3000"
echo "  - Frontend:      http://localhost:5173"
echo ""
echo "Logs are available in the logs/ directory:"
echo "  - AI Service:    logs/ai-service.log"
echo "  - Backend:       logs/backend.log"
echo "  - Frontend:      logs/frontend.log"
echo ""
echo "To stop all services, run: ./stop-services.sh"
echo "Or manually kill processes:"
echo "  kill $AI_PID $BACKEND_PID $FRONTEND_PID"
echo ""

