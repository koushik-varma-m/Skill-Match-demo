import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import JobApplicationForm from '../components/JobApplicationForm';
import JobList from '../components/Jobs';
import { useLocation } from 'react-router-dom';

const Jobs = () => {
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    type: 'FULL_TIME',
    description: '',
    requirements: '',
    salary: '',
    skills: '',
    experience: '',
    education: ''
  });
  const [showJobForm, setShowJobForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check if we should show the job form from navigation state
    if (location.state?.showJobForm) {
      setShowJobForm(true);
    }
  }, [location]);

  const resetJobForm = () => {
    setNewJob({
      title: '',
      company: '',
      location: '',
      type: 'FULL_TIME',
      description: '',
      requirements: '',
      salary: '',
      skills: '',
      experience: '',
      education: ''
    });
    setIsEditing(false);
    setShowJobForm(false);
    setSelectedJob(null);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      // Convert skills string to array and trim whitespace (handle empty string)
      const skillsArray = newJob.skills && newJob.skills.trim() 
        ? newJob.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '')
        : [];
      
      const jobData = {
        ...newJob,
        skills: skillsArray
      };

      // Ensure all string fields are not null
      Object.keys(jobData).forEach(key => {
        if (typeof jobData[key] === 'string') {
          jobData[key] = jobData[key] || '';
        }
      });

      console.log('Sending job data:', jobData); // Debug log

      if (isEditing && selectedJob?.id) {
        // Update existing job
        const response = await axios.put(`http://localhost:3000/api/job/${selectedJob.id}`, jobData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Update response:', response.data); // Debug log
      } else {
        // Create new job
        const response = await axios.post('http://localhost:3000/api/job', jobData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Create response:', response.data); // Debug log
      }

      resetJobForm();
    } catch (err) {
      console.error('Job operation error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} job posting`);
    }
  };

  const handleEditJob = (job) => {
    console.log('handleEditJob called with job:', job); // Debug log
    setSelectedJob(job);
    setNewJob({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      type: job.type || 'FULL_TIME',
      description: job.description || '',
      requirements: job.requirements || '',
      salary: job.salary || '',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      experience: job.experience || '',
      education: job.education || ''
    });
    setIsEditing(true);
    setShowJobForm(true);
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false);
    setSelectedJob(null);
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await axios.delete(`http://localhost:3000/api/job/${jobId}`, {
        withCredentials: true
      });
    } catch (err) {
      setError('Failed to delete job posting');
      console.error('Job deletion error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {error && (
        <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Job List Component */}
      <JobList 
        onEditJob={handleEditJob} 
        onApply={handleApply} 
        onDeleteJob={handleDeleteJob}
        onPostNewJob={() => setShowJobForm(true)}
      />

      {/* Job Form Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditing ? 'Edit Job Posting' : 'Post a New Job'}
              </h2>
              <button
                onClick={resetJobForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  value={newJob.company}
                  onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                  placeholder="e.g., New York, NY or Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Type *
                </label>
                <select
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                  rows="4"
                  placeholder="Describe the job responsibilities and requirements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements *
                </label>
                <textarea
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                  rows="4"
                  placeholder="List the required qualifications and skills..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary
                </label>
                <input
                  type="text"
                  value={newJob.salary}
                  onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., $80,000 - $100,000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <input
                  type="text"
                  value={newJob.skills}
                  onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter skills separated by commas (e.g., React, Node.js, Python)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level *
                </label>
                <select
                  value={newJob.experience}
                  onChange={(e) => setNewJob({ ...newJob, experience: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="">Select Experience Level</option>
                  <option value="ENTRY">Entry Level</option>
                  <option value="MID">Mid Level</option>
                  <option value="SENIOR">Senior Level</option>
                  <option value="LEAD">Lead Level</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education *
                </label>
                <input
                  type="text"
                  value={newJob.education}
                  onChange={(e) => setNewJob({ ...newJob, education: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                  placeholder="e.g., Bachelor's in Computer Science"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={resetJobForm}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  {isEditing ? 'Update Job' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Apply for {selectedJob.title}</h2>
              <button
                onClick={() => setShowApplicationForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <JobApplicationForm
              job={selectedJob}
              onSuccess={handleApplicationSuccess}
              onClose={() => setShowApplicationForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs; 