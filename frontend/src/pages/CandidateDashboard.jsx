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
        {/* Job Search Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Jobs</h2>
          <p className="text-gray-600 mb-4">Search and apply for jobs that match your skills and interests.</p>
          <button
            onClick={handleSearchJobs}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            Search Jobs
          </button>
        </div>

        {/* Applications Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Applications</h2>
          <p className="text-gray-600 mb-4">Track the status of your job applications.</p>
          <button
            onClick={handleViewApplications}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            View Applications
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Profile</h2>
          <p className="text-gray-600 mb-4">Keep your profile and skills up to date.</p>
          <button
            onClick={handleUpdateProfile}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            Edit Profile
          </button>
        </div>

        {/* Skills Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Skills</h2>
          <p className="text-gray-600 mb-4">Update your skills to match job requirements.</p>
          <button
            onClick={handleUpdateSkills}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            Update Skills
          </button>
        </div>

        {/* Network Card */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Network</h2>
          <p className="text-gray-600 mb-4">Build your professional network.</p>
          <button
            onClick={handleNetwork}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            View Network
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard; 