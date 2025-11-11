import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Jobs from './pages/Jobs';
import Posts from './pages/Posts';
import Connections from './pages/Connections';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import MyApplications from './components/MyApplications';
import RecruiterApplications from './components/RecruiterApplications';
import JobDetails from './pages/JobDetails';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Notifications from './components/Notifications';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/profile/:userId" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile/edit" 
                element={
                  <PrivateRoute>
                    <EditProfile />
                  </PrivateRoute>
                } 
              />
              
              {/* Protected Routes */}
              <Route 
                path="/candidate/dashboard" 
                element={
                  <PrivateRoute>
                    <CandidateDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/recruiter/dashboard" 
                element={
                  <PrivateRoute>
                    <RecruiterDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/jobs" 
                element={
                  <PrivateRoute>
                    <Jobs />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/jobs/:jobId" 
                element={
                  <PrivateRoute>
                    <JobDetails />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/my-applications" 
                element={
                  <PrivateRoute>
                    <MyApplications />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/recruiter-applications" 
                element={
                  <PrivateRoute>
                    <RecruiterApplications />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/posts" 
                element={
                  <PrivateRoute>
                    <Posts />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/connections" 
                element={
                  <PrivateRoute>
                    <Connections />
                  </PrivateRoute>
                } 
              />
              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <Notifications />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
      </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
