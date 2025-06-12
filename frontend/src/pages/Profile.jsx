import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      // If no userId in params, fetch current user's profile
      const endpoint = userId ? `/api/user/${userId}` : '/api/user/profile';
      const response = await axios.get(`http://localhost:3000${endpoint}`, {
        withCredentials: true
      });
      
      // Handle both response formats
      const profileData = userId ? response.data.user : response.data;
      setProfile(profileData);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-600 p-4">
        Profile not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              {profile.profilePicture ? (
                <img
                  src={`http://localhost:3000${profile.profilePicture}`}
                  alt={profile.firstname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                  {profile.firstname[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {profile.firstname} {profile.lastname}
              </h1>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>
          {!userId && (
            <button
              onClick={() => navigate('/profile/edit')}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-gray-700">
              {profile.about || 'No about information available'}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              )) || 'No skills listed'}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Experience</h2>
            <p className="text-gray-700">
              {profile.experience || 'No experience listed'}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Education</h2>
            <p className="text-gray-700">
              {profile.education || 'No education listed'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 