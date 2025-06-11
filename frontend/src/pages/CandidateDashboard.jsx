import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleViewJobs = () => {
    navigate('/jobs');
  };

  const handleUpdateProfile = () => {
    navigate('/profile/edit');
  };

  const handleViewApplications = () => {
    navigate('/applications');
  };

  const handleSearchJobs = () => {
    navigate('/jobs');
  };

  const handleUpdateSkills = () => {
    navigate('/profile/edit');
  };

  const handleViewMessages = () => {
    navigate('/messages');
  };

  const handleNetwork = () => {
    navigate('/connections');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user?.firstname}!</h1>
        <p className="text-gray-600">Your candidate dashboard is here to help you find your next opportunity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Job Recommendations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Recommendations</h2>
          <p className="text-gray-600 mb-4">Jobs that match your skills and preferences</p>
          <button 
            onClick={handleViewJobs}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Jobs
          </button>
        </div>

        {/* Profile Completion */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Completion</h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <p className="text-gray-600 mb-4">Complete your profile to get better job matches</p>
          <button 
            onClick={handleUpdateProfile}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update Profile
          </button>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Applications</h2>
          <p className="text-gray-600 mb-4">Track your job applications and their status</p>
          <button 
            onClick={handleViewApplications}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Applications
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleSearchJobs}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Search Jobs
          </button>
          <button 
            onClick={handleUpdateSkills}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Update Skills
          </button>
          <button 
            onClick={handleViewMessages}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            View Messages
          </button>
          <button 
            onClick={handleNetwork}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Network
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard; 