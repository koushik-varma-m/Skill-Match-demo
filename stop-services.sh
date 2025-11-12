#!/bin/bash

# SkillMatch Application Stop Script
# This script stops all services

echo "========================================="
echo "Stopping SkillMatch Application Services"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop services by PID if files exist
if [ -f "logs/ai-service.pid" ]; then
    AI_PID=$(cat logs/ai-service.pid)
    if kill -0 $AI_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping AI Service (PID: $AI_PID)...${NC}"
        kill $AI_PID
        rm logs/ai-service.pid
        echo -e "${GREEN}AI Service stopped${NC}"
    else
        echo -e "${YELLOW}AI Service PID file found but process not running${NC}"
        rm logs/ai-service.pid
    fi
else
    echo -e "${YELLOW}Stopping AI Service by process name...${NC}"
    pkill -f "uvicorn resume_match_service" || echo -e "${YELLOW}AI Service not running${NC}"
fi

if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping Backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        rm logs/backend.pid
        echo -e "${GREEN}Backend stopped${NC}"
    else
        echo -e "${YELLOW}Backend PID file found but process not running${NC}"
        rm logs/backend.pid
    fi
else
    echo -e "${YELLOW}Stopping Backend by process name...${NC}"
    pkill -f "node index.js" || echo -e "${YELLOW}Backend not running${NC}"
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping Frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        rm logs/frontend.pid
        echo -e "${GREEN}Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend PID file found but process not running${NC}"
        rm logs/frontend.pid
    fi
else
    echo -e "${YELLOW}Stopping Frontend by process name...${NC}"
    pkill -f "vite" || echo -e "${YELLOW}Frontend not running${NC}"
fi

# Also kill by port as backup
echo -e "${YELLOW}Checking for processes on ports 8000, 3000, 5173...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null || echo -e "${YELLOW}Port 8000 cleared${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo -e "${YELLOW}Port 3000 cleared${NC}"
lsof -ti:5173 | xargs kill -9 2>/dev/null || echo -e "${YELLOW}Port 5173 cleared${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}All services stopped${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

