# SkillMatch - Professional Networking & Job Platform

SkillMatch is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) application that connects job seekers with recruiters, providing a comprehensive platform for professional networking and job hunting.

## 🌟 Features

### For Job Seekers
- Create and manage professional profiles
- Browse and search for jobs with advanced filters
- Apply to jobs with resume upload
- Track application status (Pending, Accepted, Rejected)
- Connect with other professionals
- View and manage job applications
- Real-time notifications for application updates

### For Recruiters
- Post and manage job listings
- Review and manage job applications
- Update application statuses
- Connect with potential candidates
- View candidate profiles and resumes
- Send notifications to applicants

### General Features
- User authentication and authorization
- Real-time updates using WebSocket
- Responsive design for all devices
- Advanced search and filtering capabilities
- Professional networking features
- Secure file uploads for resumes

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS for styling
- Axios for API requests
- React Router for navigation
- Context API for state management
- Vite for build tooling

### Backend
- Node.js with Express.js
- MongoDB with Prisma ORM
- JWT for authentication
- WebSocket for real-time features
- Multer for file uploads
- Nodemailer for email notifications

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/koushik-varma-m/Skill-Match-demo.git
cd SkillMatch
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
```bash
# In backend directory
cp .env.example .env
# Update the .env file with your configuration
```

4. Start the development servers
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm run dev
```

## 📝 API Documentation

The API documentation is available at `/api-docs` when running the backend server.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Koushik Varma M - Initial work

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Inspired by professional networking platforms like LinkedIn
