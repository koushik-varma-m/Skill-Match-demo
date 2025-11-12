# API Documentation

Complete API reference for SkillMatch backend.

**Base URL:** `http://localhost:3000/api`

All endpoints require authentication except `/auth/signup` and `/auth/signin`.

---

## Authentication

### Register User
**POST** `/auth/signup`

**Request Body:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "role": "CANDIDATE" // or "RECRUITER"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "CANDIDATE"
  }
}
```

### Login
**POST** `/auth/signin`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "CANDIDATE"
  }
}
```
*Sets HTTP-only cookie with JWT token*

### Logout
**POST** `/auth/signout`

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

## User Management

### Get Current User Profile
**GET** `/user/profile`

**Response:**
```json
{
  "id": 1,
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "role": "CANDIDATE",
  "profilePicture": "/uploads/profile/profile-123.jpg",
  "about": "Software engineer with 5 years of experience",
  "skills": ["JavaScript", "React", "Node.js"],
  "experiences": [
    {
      "id": 1,
      "company": "Tech Corp",
      "description": "Senior Developer",
      "fromMonth": 1,
      "fromYear": 2020,
      "toMonth": 12,
      "toYear": 2023,
      "isCurrent": false
    }
  ],
  "educations": [
    {
      "id": 1,
      "institution": "University",
      "description": "Computer Science",
      "fromMonth": 9,
      "fromYear": 2015,
      "toMonth": 5,
      "toYear": 2019,
      "isCurrent": false
    }
  ]
}
```

### Update Profile
**PUT** `/user/profile`

**Request:** `multipart/form-data`
- `about` (string, optional)
- `skills` (string, comma-separated, optional)
- `profilePicture` (file, optional)
- `experience` (string, newline-separated, optional)
- `education` (string, newline-separated, optional)

**Response:**
```json
{
  "message": "Profile updated successfully",
  "profile": { ... }
}
```

### Search Users
**GET** `/user/search?q=searchterm`

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "firstname": "John",
      "lastname": "Doe",
      "username": "johndoe",
      "profile": {
        "profilePicture": "/uploads/profile/profile-123.jpg"
      }
    }
  ]
}
```

---

## Jobs

### Get All Jobs
**GET** `/job?location=New York&type=Full-time&experience=Senior`

**Query Parameters:**
- `location` (optional) - Filter by location
- `type` (optional) - Filter by job type
- `experience` (optional) - Filter by experience level
- `search` (optional) - Search in title/description

**Response:**
```json
{
  "jobs": [
    {
      "id": 1,
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "New York, NY",
      "type": "Full-time",
      "description": "Job description...",
      "requirements": ["5+ years experience", "React knowledge"],
      "skills": ["JavaScript", "React", "Node.js"],
      "experience": "Senior",
      "education": "Bachelor's",
      "salary": "$100k - $150k",
      "recruiter": {
        "id": 2,
        "firstname": "Jane",
        "lastname": "Smith"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Job Details
**GET** `/job/:id`

**Response:**
```json
{
  "job": {
    "id": 1,
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "New York, NY",
    "type": "Full-time",
    "description": "Full job description...",
    "requirements": ["5+ years experience", "React knowledge"],
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": "Senior",
    "education": "Bachelor's",
    "salary": "$100k - $150k",
    "recruiter": {
      "id": 2,
      "firstname": "Jane",
      "lastname": "Smith",
      "profile": {
        "profilePicture": "/uploads/profile/profile-456.jpg"
      }
    },
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Create Job (Recruiter Only)
**POST** `/job/create`

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Corp",
  "location": "New York, NY",
  "type": "Full-time",
  "description": "Job description...",
  "requirements": ["5+ years experience", "React knowledge"],
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": "Senior",
  "education": "Bachelor's",
  "salary": "$100k - $150k"
}
```

**Response:**
```json
{
  "message": "Job created successfully",
  "job": { ... }
}
```

### Update Job (Recruiter Only)
**PUT** `/job/:id`

**Request Body:** Same as create

**Response:**
```json
{
  "message": "Job updated successfully",
  "job": { ... }
}
```

### Delete Job (Recruiter Only)
**DELETE** `/job/:id`

**Response:**
```json
{
  "message": "Job deleted successfully"
}
```

### Apply to Job
**POST** `/job/:id/apply`

**Request:** `multipart/form-data`
- `resumeFile` (file, required) - PDF, DOC, or DOCX
- `coverLetter` (string, optional)
- `expectedSalary` (string, optional)
- `noticePeriod` (string, optional)
- `availableFrom` (date, optional)

**Response:**
```json
{
  "message": "Application submitted successfully",
  "application": {
    "id": 1,
    "jobId": 1,
    "candidateId": 1,
    "status": "PENDING",
    "resumePath": "/uploads/resumes/resume-123.pdf",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get My Applications (Candidate)
**GET** `/job/my-applications`

**Response:**
```json
{
  "applications": [
    {
      "id": 1,
      "job": {
        "id": 1,
        "title": "Senior Software Engineer",
        "company": "Tech Corp"
      },
      "status": "PENDING",
      "resumePath": "/uploads/resumes/resume-123.pdf",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Recruiter Applications
**GET** `/job/recruiter-applications`

**Response:**
```json
{
  "applications": [
    {
      "id": 1,
      "job": {
        "id": 1,
        "title": "Senior Software Engineer"
      },
      "candidate": {
        "id": 1,
        "firstname": "John",
        "lastname": "Doe",
        "email": "john@example.com",
        "profile": {
          "profilePicture": "/uploads/profile/profile-123.jpg"
        }
      },
      "status": "PENDING",
      "resumePath": "/uploads/resumes/resume-123.pdf",
      "coverLetter": "I am interested in this position...",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Update Application Status (Recruiter)
**PUT** `/job/application/:id/status`

**Request Body:**
```json
{
  "status": "ACCEPTED" // or "REJECTED", "REVIEWING"
}
```

**Response:**
```json
{
  "message": "Application status updated",
  "application": { ... }
}
```

---

## Posts & Social

### Get All Posts
**GET** `/post`

*Returns posts from user's connections and own posts*

**Response:**
```json
{
  "posts": [
    {
      "id": 1,
      "content": "Just landed my dream job!",
      "image": "/uploads/posts/post-123.jpg",
      "user": {
        "id": 1,
        "firstname": "John",
        "lastname": "Doe",
        "profile": {
          "profilePicture": "/uploads/profile/profile-123.jpg"
        }
      },
      "like": [
        {
          "id": 2,
          "firstname": "Jane",
          "lastname": "Smith"
        }
      ],
      "comments": [
        {
          "id": 1,
          "comment": "Congratulations!",
          "user": {
            "id": 2,
            "firstname": "Jane",
            "lastname": "Smith"
          },
          "createdAt": "2024-01-15T10:00:00Z"
        }
      ],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Post
**POST** `/post/create`

**Request:** `multipart/form-data`
- `content` (string, required)
- `image` (file, optional) - JPG, PNG, GIF (max 5MB)

**Response:**
```json
{
  "message": "Post created",
  "createdPost": { ... }
}
```

### Update Post
**PUT** `/post/:id`

**Request:** `multipart/form-data`
- `content` (string, required)
- `image` (file, optional)

**Response:**
```json
{
  "message": "Post updated",
  "updatedPost": { ... }
}
```

### Delete Post
**DELETE** `/post/:id`

**Response:**
```json
{
  "message": "Post deleted"
}
```

### Like/Unlike Post
**POST** `/post/:id/like`

**Response:**
```json
{
  "message": "Post liked" // or "Post unliked"
}
```

### Add Comment
**POST** `/post/:id/comment`

**Request Body:**
```json
{
  "comment": "Great post!"
}
```

**Response:**
```json
{
  "message": "Comment created",
  "createdComment": {
    "id": 1,
    "comment": "Great post!",
    "user": {
      "id": 1,
      "firstname": "John",
      "lastname": "Doe"
    },
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Delete Comment
**DELETE** `/post/:id/comment/:commentId`

**Response:**
```json
{
  "message": "Comment deleted"
}
```

---

## Connections

### Get Connections
**GET** `/connection`

**Response:**
```json
{
  "connections": [
    {
      "id": 1,
      "sender": {
        "id": 1,
        "firstname": "John",
        "lastname": "Doe"
      },
      "receiver": {
        "id": 2,
        "firstname": "Jane",
        "lastname": "Smith"
      },
      "status": "ACCEPTED",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Send Connection Request
**POST** `/connection/send/:userId`

**Response:**
```json
{
  "message": "Connection request sent",
  "connection": { ... }
}
```

### Accept Connection Request
**PUT** `/connection/:id/accept`

**Response:**
```json
{
  "message": "Connection accepted",
  "connection": { ... }
}
```

### Reject Connection Request
**PUT** `/connection/:id/reject`

**Response:**
```json
{
  "message": "Connection rejected"
}
```

### Remove Connection
**DELETE** `/connection/:id`

**Response:**
```json
{
  "message": "Connection removed"
}
```

---

## Notifications

### Get Notifications
**GET** `/notifications`

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "CONNECTION_REQUEST",
      "message": "John Doe sent you a connection request",
      "read": false,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "type": "APPLICATION_ACCEPTED",
      "message": "Your application for Senior Software Engineer has been accepted",
      "read": true,
      "createdAt": "2024-01-14T10:00:00Z"
    }
  ]
}
```

### Mark Notification as Read
**PUT** `/notifications/:id/read`

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

---

## Resume Matching

### Analyze Resume Match
**POST** `/resume-match`

**Request:** `multipart/form-data`
- `jobDescription` (string, required)
- `resumeFile` (file, required) - PDF, DOC, or DOCX (max 10MB)

**Response:**
```json
{
  "success": true,
  "similarityScore": 84.67
}
```

**Error Responses:**

**Missing File (400):**
```json
{
  "success": false,
  "message": "Resume file is required"
}
```

**Invalid File Type (400):**
```json
{
  "success": false,
  "message": "Only PDF, DOC, and DOCX files are allowed!"
}
```

**AI Service Unavailable (503):**
```json
{
  "success": false,
  "message": "AI service is not available. Please try again later."
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

### 401 Unauthorized
```json
{
  "message": "Please log in to access this resource"
}
```

### 403 Forbidden
```json
{
  "message": "You are not authorized to perform this action"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "Detailed error (development only)"
}
```

---

## Authentication

All protected endpoints require authentication via JWT token stored in HTTP-only cookies.

**How it works:**
1. User logs in via `/auth/signin`
2. Server sets HTTP-only cookie with JWT token
3. Client automatically includes cookie in subsequent requests
4. Server validates token on protected routes

**Manual token usage (if needed):**
- Token can also be sent in `Authorization` header: `Bearer <token>`

---

## Rate Limiting

Currently, there are no rate limits implemented. Consider adding rate limiting for production use.

---

## File Upload Limits

- **Resumes:** 10MB max
- **Profile Pictures:** 5MB max
- **Post Images:** 5MB max
- **Allowed formats:**
  - Resumes: PDF, DOC, DOCX
  - Images: JPG, JPEG, PNG, GIF

---

## CORS

CORS is configured to allow requests from:
- `http://localhost:5173` (Frontend development server)

For production, update CORS configuration in `backend/index.js`.

---

For more details on specific endpoints, see:
- [Resume Match API](./backend/routes/RESUME_MATCH_API.md)
- [AI Client Documentation](./backend/utils/AI_CLIENT_README.md)

