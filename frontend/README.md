# SkillMatch Frontend

React-based frontend application for SkillMatch platform.

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Context API** - State management
- **date-fns** - Date utilities

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── PrivateRoute.jsx
│   │   ├── Notifications.jsx
│   │   ├── MatchScore.jsx
│   │   ├── JobApplicationForm.jsx
│   │   ├── MyApplications.jsx
│   │   └── RecruiterApplications.jsx
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Profile.jsx
│   │   ├── EditProfile.jsx
│   │   ├── Jobs.jsx
│   │   ├── JobDetails.jsx
│   │   ├── Posts.jsx
│   │   ├── Connections.jsx
│   │   ├── CandidateDashboard.jsx
│   │   ├── RecruiterDashboard.jsx
│   │   └── ResumeMatch.jsx
│   ├── context/            # React Context
│   │   └── AuthContext.jsx
│   ├── assets/             # Static assets
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Public assets
├── dist/                   # Build output
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:5173

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### API Base URL

The API base URL is configured in `src/context/AuthContext.jsx`:

```javascript
axios.defaults.baseURL = 'http://localhost:3000';
```

For production, update this to your backend URL.

### Environment Variables

Create a `.env` file in the frontend directory (optional):

```env
VITE_API_URL=http://localhost:3000
```

Then use in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## 📱 Pages & Routes

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page

### Protected Routes (Require Authentication)
- `/profile` - Current user's profile
- `/profile/:userId` - View other user's profile
- `/profile/edit` - Edit profile
- `/jobs` - Browse jobs
- `/job/:id` - Job details
- `/my-applications` - View applications (Candidate)
- `/candidate/dashboard` - Candidate dashboard
- `/recruiter/dashboard` - Recruiter dashboard
- `/recruiter-applications` - Manage applications (Recruiter)
- `/posts` - Social feed
- `/connections` - Connections management
- `/notifications` - Notifications
- `/resume-match` - Resume matching tool

## 🎨 Styling

The project uses **Tailwind CSS** for styling.

### Custom Classes

Common utility classes are defined in `src/index.css`:
- `.card` - Card container
- `.input-field` - Form input styling
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button

### Tailwind Configuration

Custom configuration in `tailwind.config.js`:
- Custom colors (teal theme)
- Custom spacing
- Custom breakpoints

## 🔐 Authentication

Authentication is handled via:
- **AuthContext** - Provides user state and auth methods
- **PrivateRoute** - Protects routes requiring authentication
- **JWT Tokens** - Stored in HTTP-only cookies

### Usage Example

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.firstname}!</div>;
}
```

## 📡 API Integration

API calls are made using Axios with automatic cookie handling:

```javascript
import axios from 'axios';

// GET request
const response = await axios.get('/api/job', {
  withCredentials: true
});

// POST request
const response = await axios.post('/api/job/create', data, {
  withCredentials: true
});

// File upload
const formData = new FormData();
formData.append('file', file);
const response = await axios.post('/api/upload', formData, {
  withCredentials: true,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

## 🖼️ Image Handling

Images are served from the backend:

```javascript
// Profile picture
<img src={`http://localhost:3000${user.profile?.profilePicture}`} />

// Post image
<img src={`http://localhost:3000${post.image}`} />
```

## 📦 Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Preview the build**
   ```bash
   npm run preview
   ```

3. **Deploy**
   - The `dist/` folder contains the production build
   - Serve with a web server (Nginx, Apache, etc.)
   - Configure API proxy if needed

### Production Build Configuration

Update `vite.config.js` for production:

```javascript
export default {
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser'
  }
}
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>
```

### Build Errors

1. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Should be v14+
   ```

### CORS Issues

Ensure backend CORS is configured to allow requests from `http://localhost:5173`.

### API Connection Issues

1. Verify backend is running on port 3000
2. Check API base URL in `AuthContext.jsx`
3. Check browser console for errors
4. Verify cookies are being sent (check Network tab)

## 📝 Code Style

- Use functional components with hooks
- Follow React best practices
- Use meaningful component and variable names
- Keep components small and focused
- Extract reusable logic into custom hooks

## 🔄 State Management

Currently using React Context API for global state (authentication).

For complex state management, consider:
- Redux
- Zustand
- Jotai

## 🧪 Testing

Currently, no tests are configured. Consider adding:
- React Testing Library
- Jest
- Vitest (Vite's test runner)

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)

---

For backend API documentation, see [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
