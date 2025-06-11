import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EditProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    about: '',
    skills: '',
    experience: '',
    education: ''
  });
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/user/profile');
      setProfile(response.data);
      setFormData({
        about: response.data.about || '',
        skills: response.data.skills?.join(', ') || '',
        experience: response.data.experience?.join('\n') || '',
        education: response.data.education?.join('\n') || ''
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
  
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
  
    try {
      const uploadData = new FormData();
      uploadData.append('profilePicture', file);
      
      // Add other profile fields to maintain existing data
      uploadData.append('about', formData.about || '');
      uploadData.append('skills', formData.skills || '');
      uploadData.append('experience', formData.experience || '');
      uploadData.append('education', formData.education || '');
  
      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
  
      const response = await axios.put('/api/user/profile', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      console.log('Upload response:', response.data);
  
      if (response.data) {
        setProfile(prev => ({
          ...prev,
          ...response.data
        }));
        setError('');
      }
    } catch (err) {
      console.error('Photo upload error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Failed to upload photo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert form data to match backend expectations
      const submitData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        experience: formData.experience.split('\n').filter(Boolean),
        education: formData.education.split('\n').filter(Boolean)
      };

      const response = await axios.put('/api/user/profile', submitData);
      setProfile(response.data);
      navigate('/profile');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-6 mb-6">
            <div 
              className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handlePhotoClick}
            >
              {profile.profilePicture ? (
                <img
                  src={`http://localhost:3000${profile.profilePicture}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  {user?.firstname?.[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-gray-600">Click on the profile picture to change it</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About
            </label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
              rows="4"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter skills separated by commas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience
            </label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
              rows="4"
              placeholder="Enter each experience on a new line"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education
            </label>
            <textarea
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
              rows="4"
              placeholder="Enter each education entry on a new line"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;