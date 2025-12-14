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
    skills: ''
  });
  const [experiences, setExperiences] = useState([]);
  const [educations, setEducations] = useState([]);
  const [editingExperience, setEditingExperience] = useState(null);
  const [editingEducation, setEditingEducation] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/user/profile', {
        withCredentials: true
      });
      setProfile(response.data);
      setFormData({
        about: response.data.about || '',
        skills: response.data.skills?.join(', ') || ''
      });
      setExperiences(response.data.experiences || []);
      setEducations(response.data.educations || []);
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
  
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
  
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
  
    try {
      const uploadData = new FormData();
      uploadData.append('profilePicture', file);
      uploadData.append('about', formData.about || '');
      uploadData.append('skills', formData.skills || '');
  
      const response = await axios.put('http://localhost:3000/api/user/profile', uploadData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.data) {
        setProfile(prev => ({
          ...prev,
          ...response.data
        }));
        setError('');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload photo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean)
      };

      await axios.put('http://localhost:3000/api/user/profile', submitData, {
        withCredentials: true
      });
      navigate('/profile');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAddExperience = () => {
    setEditingExperience({
      company: '',
      description: '',
      fromMonth: 1,
      fromYear: currentYear,
      toMonth: null,
      toYear: null,
      isCurrent: false
    });
  };

  const handleEditExperience = (exp) => {
    setEditingExperience({ ...exp });
  };

  const handleSaveExperience = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      console.log('Saving experience:', editingExperience);
      
      if (!editingExperience.company || !editingExperience.description) {
        setError('Company and description are required');
        return;
      }

      if (!editingExperience.fromMonth || !editingExperience.fromYear) {
        setError('From month and year are required');
        return;
      }

      const experienceData = {
        company: editingExperience.company.trim(),
        description: editingExperience.description.trim(),
        fromMonth: parseInt(editingExperience.fromMonth),
        fromYear: parseInt(editingExperience.fromYear),
        toMonth: editingExperience.isCurrent ? null : (editingExperience.toMonth ? parseInt(editingExperience.toMonth) : null),
        toYear: editingExperience.isCurrent ? null : (editingExperience.toYear ? parseInt(editingExperience.toYear) : null),
        isCurrent: editingExperience.isCurrent || false
      };

      console.log('Experience data to send:', experienceData);

      let response;
      if (editingExperience.id) {
        console.log('Updating experience:', editingExperience.id);
        response = await axios.put(`http://localhost:3000/api/user/experience/${editingExperience.id}`, experienceData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.log('Creating new experience');
        response = await axios.post('http://localhost:3000/api/user/experience', experienceData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('Experience saved successfully:', response.data);
      await fetchProfile();
      setEditingExperience(null);
      setError('');
    } catch (err) {
      console.error('Error saving experience:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to save experience');
    }
  };

  const handleDeleteExperience = async (id) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/user/experience/${id}`, {
        withCredentials: true
      });
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete experience');
    }
  };

  const handleAddEducation = () => {
    setEditingEducation({
      institution: '',
      description: '',
      fromMonth: 1,
      fromYear: currentYear,
      toMonth: null,
      toYear: null,
      isCurrent: false
    });
  };

  const handleEditEducation = (edu) => {
    setEditingEducation({ ...edu });
  };

  const handleSaveEducation = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      console.log('Saving education:', editingEducation);
      
      if (!editingEducation.institution || !editingEducation.description) {
        setError('Institution and description are required');
        return;
      }

      if (!editingEducation.fromMonth || !editingEducation.fromYear) {
        setError('From month and year are required');
        return;
      }

      const educationData = {
        institution: editingEducation.institution.trim(),
        description: editingEducation.description.trim(),
        fromMonth: parseInt(editingEducation.fromMonth),
        fromYear: parseInt(editingEducation.fromYear),
        toMonth: editingEducation.isCurrent ? null : (editingEducation.toMonth ? parseInt(editingEducation.toMonth) : null),
        toYear: editingEducation.isCurrent ? null : (editingEducation.toYear ? parseInt(editingEducation.toYear) : null),
        isCurrent: editingEducation.isCurrent || false
      };

      console.log('Education data to send:', educationData);

      let response;
      if (editingEducation.id) {
        console.log('Updating education:', editingEducation.id);
        response = await axios.put(`http://localhost:3000/api/user/education/${editingEducation.id}`, educationData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.log('Creating new education');
        response = await axios.post('http://localhost:3000/api/user/education', educationData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('Education saved successfully:', response.data);
      await fetchProfile();
      setEditingEducation(null);
      setError('');
    } catch (err) {
      console.error('Error saving education:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to save education');
    }
  };

  const handleDeleteEducation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this education?')) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/user/education/${id}`, {
        withCredentials: true
      });
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete education');
    }
  };

  const formatDate = (month, year) => {
    if (!month || !year) return '';
    return `${months.find(m => m.value === month)?.label || ''} ${year}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center space-x-6 mb-6">
            <div 
              className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handlePhotoClick}
            >
              {profile?.profilePicture ? (
                <img
                  src={`http://localhost:3000${profile.profilePicture}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
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

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About
            </label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleInputChange}
                className="w-full p-2 border rounded-lg input-field"
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
                className="w-full p-2 border rounded-lg input-field"
              placeholder="Enter skills separated by commas"
            />
          </div>
          </form>

          {/* Experiences Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Experience</h2>
              <button
                type="button"
                onClick={handleAddExperience}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                + Add Experience
              </button>
            </div>

            {editingExperience && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-3">
                  {editingExperience.id ? 'Edit Experience' : 'Add Experience'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                    <input
                      type="text"
                      value={editingExperience.company}
                      onChange={(e) => setEditingExperience({ ...editingExperience, company: e.target.value })}
                      className="w-full p-2 border rounded-lg input-field"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
                      value={editingExperience.description}
                      onChange={(e) => setEditingExperience({ ...editingExperience, description: e.target.value })}
                      className="w-full p-2 border rounded-lg input-field"
                      rows="3"
                      placeholder="Job description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Month *</label>
                      <select
                        value={editingExperience.fromMonth}
                        onChange={(e) => setEditingExperience({ ...editingExperience, fromMonth: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded-lg input-field"
                      >
                        {months.map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Year *</label>
                      <select
                        value={editingExperience.fromYear}
                        onChange={(e) => setEditingExperience({ ...editingExperience, fromYear: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded-lg input-field"
                      >
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="exp-current"
                      checked={editingExperience.isCurrent}
                      onChange={(e) => {
                        const isCurrent = e.target.checked;
                        setEditingExperience({
                          ...editingExperience,
                          isCurrent,
                          toMonth: isCurrent ? null : editingExperience.toMonth,
                          toYear: isCurrent ? null : editingExperience.toYear
                        });
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="exp-current" className="text-sm text-gray-700">I currently work here</label>
                  </div>
                  {!editingExperience.isCurrent && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Month</label>
                        <select
                          value={editingExperience.toMonth || ''}
                          onChange={(e) => setEditingExperience({ ...editingExperience, toMonth: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full p-2 border rounded-lg input-field"
                        >
                          <option value="">Select month</option>
                          {months.map(month => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Year</label>
                        <select
                          value={editingExperience.toYear || ''}
                          onChange={(e) => setEditingExperience({ ...editingExperience, toYear: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full p-2 border rounded-lg input-field"
                        >
                          <option value="">Select year</option>
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveExperience(e);
                      }}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingExperience(null);
                        setError('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{exp.company}</h3>
                      <p className="text-gray-600 text-sm mt-1">{exp.description}</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {formatDate(exp.fromMonth, exp.fromYear)} - {exp.isCurrent ? 'Present' : formatDate(exp.toMonth, exp.toYear)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditExperience(exp)}
                        className="px-3 py-1 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {experiences.length === 0 && !editingExperience && (
                <p className="text-gray-500 text-center py-4">No experiences added yet</p>
              )}
            </div>
          </div>

          {/* Educations Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Education</h2>
              <button
                type="button"
                onClick={handleAddEducation}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                + Add Education
              </button>
            </div>

            {editingEducation && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-3">
                  {editingEducation.id ? 'Edit Education' : 'Add Education'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
                    <input
                      type="text"
                      value={editingEducation.institution}
                      onChange={(e) => setEditingEducation({ ...editingEducation, institution: e.target.value })}
                      className="w-full p-2 border rounded-lg input-field"
                      placeholder="School/University name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
                      value={editingEducation.description}
                      onChange={(e) => setEditingEducation({ ...editingEducation, description: e.target.value })}
                      className="w-full p-2 border rounded-lg input-field"
                      rows="3"
                      placeholder="Degree, field of study, etc."
            />
          </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Month *</label>
                      <select
                        value={editingEducation.fromMonth}
                        onChange={(e) => setEditingEducation({ ...editingEducation, fromMonth: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded-lg input-field"
                      >
                        {months.map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Year *</label>
                      <select
                        value={editingEducation.fromYear}
                        onChange={(e) => setEditingEducation({ ...editingEducation, fromYear: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded-lg input-field"
                      >
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="edu-current"
                      checked={editingEducation.isCurrent}
                      onChange={(e) => {
                        const isCurrent = e.target.checked;
                        setEditingEducation({
                          ...editingEducation,
                          isCurrent,
                          toMonth: isCurrent ? null : editingEducation.toMonth,
                          toYear: isCurrent ? null : editingEducation.toYear
                        });
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="edu-current" className="text-sm text-gray-700">I am currently studying here</label>
                  </div>
                  {!editingEducation.isCurrent && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Month</label>
                        <select
                          value={editingEducation.toMonth || ''}
                          onChange={(e) => setEditingEducation({ ...editingEducation, toMonth: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full p-2 border rounded-lg input-field"
                        >
                          <option value="">Select month</option>
                          {months.map(month => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Year</label>
                        <select
                          value={editingEducation.toYear || ''}
                          onChange={(e) => setEditingEducation({ ...editingEducation, toYear: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full p-2 border rounded-lg input-field"
                        >
                          <option value="">Select year</option>
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveEducation(e);
                      }}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Save
                    </button>
            <button
              type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingEducation(null);
                        setError('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {educations.map((edu) => (
                <div key={edu.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{edu.institution}</h3>
                      <p className="text-gray-600 text-sm mt-1">{edu.description}</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {formatDate(edu.fromMonth, edu.fromYear)} - {edu.isCurrent ? 'Present' : formatDate(edu.toMonth, edu.toYear)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditEducation(edu)}
                        className="px-3 py-1 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {educations.length === 0 && !editingEducation && (
                <p className="text-gray-500 text-center py-4">No education added yet</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              className="px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
