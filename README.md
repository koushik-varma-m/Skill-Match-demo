# SkillMatch - Professional Networking & Job Platform

SkillMatch is a full-stack application that connects job seekers with recruiters, providing a comprehensive platform for professional networking, job hunting, and AI-powered resume matching.

## 🌟 Features

### For Job Seekers (Candidates)
- **Profile Management**
  - Create and manage professional profiles with profile pictures
  - Add detailed work experience and education history
  - Showcase skills and expertise
  - Write an "About" section to describe yourself

- **Job Discovery**
  - Browse and search for job listings
  - Advanced filtering by location, type, experience level
  - View detailed job descriptions and requirements
  - Save jobs for later review

- **Job Applications**
  - Apply to jobs with resume upload (PDF, DOC, DOCX)
  - Track application status (Pending, Reviewing, Accepted, Rejected)
  - View all your applications in one place
  - Receive email notifications on status updates

- **AI-Powered Resume Matching**
  - Get instant similarity scores between your resume and job descriptions
  - Understand how well your resume matches job requirements
  - Receive AI-generated improvement suggestions
  - Get actionable recommendations to enhance your resume
  - Summarize job descriptions for quick understanding

- **Professional Networking**
  - Connect with other professionals
  - Send and receive connection requests
  - Build your professional network

- **Social Features**
  - Create and share posts
  - Like and comment on posts
  - View posts from your connections
  - Engage with the community

### For Recruiters
- **Job Posting**
  - Post new job listings with detailed descriptions
  - Specify requirements, skills, experience level, and education
  - Set salary ranges and job types
  - Manage multiple job postings

- **Application Management**
  - Review all applications for your posted jobs
  - View candidate profiles and resumes
  - Update application statuses
  - Filter and search applications

- **Candidate Evaluation**
  - View candidate profiles with full experience and education
  - Download and review resumes
  - See AI-generated resume match scores
  - Make informed hiring decisions

- **Notifications**
  - Receive notifications for new applications
  - Email notifications sent to candidates on status updates

### General Features
- **Authentication & Security**
  - Secure user registration and login
  - JWT-based authentication
  - Role-based access control (Candidate/Recruiter)
  - Protected routes and API endpoints

- **Real-time Updates**
  - Real-time notifications
  - Live updates on application status changes
  - Instant connection request notifications

- **File Management**
  - Secure file uploads for resumes and profile pictures
  - Support for multiple file formats (PDF, DOC, DOCX, JPG, PNG)
  - Automatic file organization

- **Responsive Design**
  - Mobile-friendly interface
  - Works on all devices (desktop, tablet, mobile)
  - Modern and intuitive UI with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React.js 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **Context API** - State management
- **date-fns** - Date formatting utilities

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **Prisma** - ORM for database management
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **bcrypt** - Password hashing
- **Cookie Parser** - Cookie handling

### AI Service
- **Python 3.8+** - Programming language
- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **OpenAI API** - Text embeddings (text-embedding-3-small) and GPT-3.5-turbo
- **scikit-learn** - Cosine similarity calculation
- **pdfplumber** - PDF parsing
- **python-docx** - DOCX file processing
- **spaCy** - Natural language processing for keyword extraction
- **NumPy** - Numerical computations

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Git** - [Download](https://git-scm.com/downloads)

## 🚀 Quick Start

### Option 1: Using Startup Scripts (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/koushik-varma-m/Skill-Match-demo.git
   cd SkillMatch
   ```

2. **Make scripts executable** (Linux/Mac)
   ```bash
   chmod +x start-services.sh stop-services.sh
   ```

3. **Start all services**
   ```bash
   ./start-services.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - AI Service: http://localhost:8000

5. **Stop all services**
   ```bash
   ./stop-services.sh
   ```

### Option 2: Manual Setup

#### Step 1: Database Setup

1. **Create PostgreSQL database**
   ```bash
   createdb skillmatch
   # Or using psql:
   psql -U postgres
   CREATE DATABASE skillmatch;
   ```

2. **Configure database connection**
   ```bash
   cd backend
   # Create .env file
   touch .env
   ```

3. **Add to `backend/.env`:**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/skillmatch"
   SECRET_KEY="your-super-secret-jwt-key-change-this-in-production"
   PORT=3000
   NODE_ENV="development"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="your-app-password"
   AI_SERVICE_URL="http://localhost:8000"
   ```

4. **Run Prisma migrations**
   ```bash
   cd backend
   npx prisma migrate dev
   # Or push schema without migration
   npx prisma db push
   ```

#### Step 2: Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start backend server**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

   Backend will run on http://localhost:3000

#### Step 3: AI Service Setup

1. **Create virtual environment**
   ```bash
   cd ai-service
   python3 -m venv venv
   ```

2. **Activate virtual environment**
   ```bash
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download spaCy model**
   ```bash
   python -m spacy download en_core_web_sm
   ```

5. **Configure OpenAI API Key**
   ```bash
   # Create .env file
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   OPENAI_API_KEY=your_openai_api_key_here
   ```

6. **Start AI service**
   ```bash
   uvicorn resume_match_service:app --host 0.0.0.0 --port 8000
   # Or with auto-reload for development:
   uvicorn resume_match_service:app --reload --host 0.0.0.0 --port 8000
   ```

   AI Service will run on http://localhost:8000

#### Step 4: Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will run on http://localhost:5173

## 📁 Project Structure

```
SkillMatch/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context providers
│   │   └── assets/          # Static assets
│   ├── public/              # Public assets
│   └── package.json
│
├── backend/                  # Node.js/Express backend
│   ├── controllers/         # Route controllers
│   ├── routes/              # API routes
│   ├── models/              # Data models
│   ├── middlewares/         # Express middlewares
│   ├── utils/               # Utility functions
│   ├── prisma/              # Prisma schema and migrations
│   ├── uploads/             # Uploaded files (resumes, images)
│   └── index.js             # Entry point
│
├── ai-service/              # Python FastAPI AI service
│   ├── resume_match_service.py  # Main service file
│   ├── requirements.txt      # Python dependencies
│   └── venv/                # Python virtual environment
│
├── logs/                     # Application logs
├── start-services.sh        # Startup script
├── stop-services.sh         # Stop script
└── README.md                # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### User Management
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/search` - Search users

### Jobs
- `GET /api/job` - Get all jobs (with filters)
- `GET /api/job/:id` - Get job details
- `POST /api/job/create` - Create new job (Recruiter only)
- `PUT /api/job/:id` - Update job (Recruiter only)
- `DELETE /api/job/:id` - Delete job (Recruiter only)
- `POST /api/job/:id/apply` - Apply to job
- `GET /api/job/my-applications` - Get user's applications
- `GET /api/job/recruiter-applications` - Get applications for recruiter's jobs

### Posts & Social
- `GET /api/post` - Get all posts (from connections)
- `POST /api/post/create` - Create new post
- `PUT /api/post/:id` - Update post
- `DELETE /api/post/:id` - Delete post
- `POST /api/post/:id/like` - Like/unlike post
- `POST /api/post/:id/comment` - Add comment
- `DELETE /api/post/:id/comment/:commentId` - Delete comment

### Connections
- `GET /api/connection` - Get connections
- `POST /api/connection/send/:userId` - Send connection request
- `PUT /api/connection/:id/accept` - Accept connection request
- `PUT /api/connection/:id/reject` - Reject connection request
- `DELETE /api/connection/:id` - Remove connection

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Resume Matching
- `POST /api/resume-match` - Analyze resume-job similarity

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🎯 Usage Guide

### For Job Seekers

1. **Register/Login**
   - Create an account or login with existing credentials
   - Choose "Candidate" role during registration

2. **Complete Your Profile**
   - Go to Profile → Edit Profile
   - Upload a profile picture
   - Add your "About" section
   - Add your skills
   - Add work experience and education

3. **Browse Jobs**
   - Navigate to Jobs page
   - Use filters to find relevant jobs
   - Click on a job to view details

4. **Apply to Jobs**
   - Click "Apply" on a job listing
   - Upload your resume (PDF, DOC, or DOCX)
   - Fill in application details
   - Submit application

5. **Track Applications**
   - Go to "My Applications" to see all your applications
   - View application status and match scores

6. **Use Resume Matching**
   - Go to "Resume Match" page
   - Upload your resume
   - Enter or paste a job description (or select from posted jobs)
   - Use "AI Summarize" to get quick job description summary
   - Get instant similarity score with matched/missing keywords
   - View AI-powered improvement suggestions

7. **Network**
   - Connect with other professionals
   - Create and share posts
   - Engage with the community

### For Recruiters

1. **Register/Login**
   - Create an account with "Recruiter" role

2. **Post Jobs**
   - Go to Recruiter Dashboard
   - Click "Post New Job"
   - Fill in job details (title, description, requirements, etc.)
   - Publish the job

3. **Manage Applications**
   - Go to "Recruiter Applications"
   - View all applications for your jobs
   - Review candidate profiles and resumes
   - See AI-generated match scores
   - Update application status (Pending → Reviewing → Accepted/Rejected)

4. **Network**
   - Connect with potential candidates
   - View candidate profiles
   - Engage with the community

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/skillmatch"

# JWT Secret (use a strong random string in production)
SECRET_KEY="your-super-secret-jwt-key"

# Server
PORT=3000
NODE_ENV="development"

# Email Service (for notifications)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# AI Service
AI_SERVICE_URL="http://localhost:8000"
```

#### Frontend
- API base URL is configured in `frontend/src/context/AuthContext.jsx`
- Default: `http://localhost:3000`

#### AI Service (.env)
```env
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here
```

- Port: 8000 (default)
- Models: OpenAI text-embedding-3-small (embeddings) and GPT-3.5-turbo (suggestions/summaries)

## 🧪 Testing

### Health Checks

**AI Service:**
```bash
curl http://localhost:8000/health
```

**Backend:**
```bash
curl http://localhost:3000
```

### Test Resume Matching

```bash
curl -X POST "http://localhost:3000/api/resume-match" \
  -F "jobDescription=Software Engineer with Python experience" \
  -F "resumeFile=@/path/to/resume.pdf"
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8000  # AI Service
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env` file
3. Verify database exists: `psql -l`
4. Run migrations: `npx prisma migrate dev`

### AI Service Not Starting

1. **Check virtual environment:**
   ```bash
   cd ai-service
   source venv/bin/activate
   ```

2. **Verify OpenAI API Key:**
   ```bash
   # Check .env file exists and has OPENAI_API_KEY
   cat .env | grep OPENAI_API_KEY
   ```

3. **Reinstall dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download spaCy model:**
   ```bash
   python -m spacy download en_core_web_sm
   ```

5. **Check Python version:**
   ```bash
   python3 --version  # Should be 3.8+
   ```

### Frontend Build Issues

1. **Clear cache and reinstall:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Should be v14+
   ```

### File Upload Issues

- Check `backend/uploads/` directory exists
- Verify file size limits (10MB for resumes, 5MB for images)
- Check file permissions

## 📝 Logs

When using startup scripts, logs are saved to:
- `logs/ai-service.log` - AI Service logs
- `logs/backend.log` - Backend logs
- `logs/frontend.log` - Frontend logs

View logs:
```bash
tail -f logs/backend.log
tail -f logs/ai-service.log
```

## 🔒 Security Notes

- **Never commit `.env` files** - They contain sensitive information
- **Use strong JWT secrets** in production
- **Enable HTTPS** in production
- **Validate file uploads** - Only allow specific file types
- **Sanitize user inputs** - Prevent SQL injection and XSS
- **Use environment variables** for all sensitive configuration

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use a process manager (PM2, Forever)
3. Enable HTTPS
4. Configure proper CORS origins
5. Use a production database

### Frontend
1. Build for production: `npm run build`
2. Serve static files with a web server (Nginx, Apache)
3. Configure API proxy
4. Enable HTTPS

### AI Service
1. Use production ASGI server (Gunicorn with Uvicorn workers)
2. Configure proper resource limits
3. Use a reverse proxy (Nginx)
4. Enable HTTPS

## 📚 Additional Documentation

- [AI Service README](./ai-service/README.md) - AI service documentation and setup
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [AI Use Cases](./AI_USE_CASES.md) - AI features and use cases documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Koushik Varma M** - Initial work

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Inspired by professional networking platforms like LinkedIn
- Built with modern web technologies and best practices

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Happy Job Hunting! 🎯**
