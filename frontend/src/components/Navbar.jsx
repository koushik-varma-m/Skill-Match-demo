import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">
            SkillMatch
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to={user.role === 'CANDIDATE' ? '/candidate/dashboard' : '/recruiter/dashboard'} 
                  className="text-gray-600 hover:text-blue-600"
                >
                  Dashboard
                </Link>
                <Link to="/jobs" className="text-gray-600 hover:text-blue-600">
                  Jobs
                </Link>
                {user.role === 'CANDIDATE' && (
                  <Link to="/applications" className="text-gray-600 hover:text-blue-600">
                    My Applications
                  </Link>
                )}
                {user.role === 'RECRUITER' && (
                  <Link to="/recruiter/applications" className="text-gray-600 hover:text-blue-600">
                    Applications
                  </Link>
                )}
                <Link to="/posts" className="text-gray-600 hover:text-blue-600">
                  Posts
                </Link>
                <Link to="/connections" className="text-gray-600 hover:text-blue-600">
                  Connections
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-blue-600">
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 