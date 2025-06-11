const express = require('express');
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRouter = require('./routes/auth.route');
const connectionRouter = require('./routes/connection.route');
const userRouter = require('./routes/user.route');
const jobsRouter = require('./routes/job.route');
const postRouter = require('./routes/post.route');
const recruiterRouter = require('./routes/recruiter.route');

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/connection', connectionRouter);
app.use('/api/job', jobsRouter);
app.use('/api/post', postRouter);
app.use('/api/recruiter', recruiterRouter);

// Create upload directories if they don't exist
const uploadDirs = ['uploads', 'uploads/profile', 'uploads/posts', 'uploads/resumes'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!require('fs').existsSync(dirPath)) {
    require('fs').mkdirSync(dirPath, { recursive: true });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});