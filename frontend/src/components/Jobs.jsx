import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import JobApplicationForm from './JobApplicationForm';

const JobList = ({ onEditJob, onDeleteJob, onPostNewJob }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    search: '',
    location: '',
    type: '',
    experience: ''
  });
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const { user } = useAuth();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axios.get(`http://localhost:3000/api/job?${queryParams.toString()}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Raw response:', response.data); // Debug log for raw response
      console.log('Fetched jobs:', response.data.jobs); // Debug log for jobs array
      if (response.data.jobs && response.data.jobs.length > 0) {
        console.log('First job application status:', response.data.jobs[0].applicationStatus); // Debug log for first job's status
      }
      setJobs(response.data.jobs);
      setFilteredJobs(response.data.jobs);
      setError(null);
    } catch (err) {
      console.error('Jobs fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []); // Only fetch on initial load

  useEffect(() => {
    // Filter jobs based on quick search
    if (quickSearch.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const searchLower = quickSearch.toLowerCase();
      const filtered = jobs.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        job.skills?.some(skill => skill.toLowerCase().includes(searchLower))
      );
      setFilteredJobs(filtered);
    }
  }, [quickSearch, jobs]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleClearSearch = () => {
    setSearchParams({
      search: '',
      location: '',
      type: '',
      experience: ''
    });
    setQuickSearch('');
    fetchJobs();
  };

  const handleEditClick = (job) => {
    console.log('Edit button clicked for job:', job); // Debug log
    if (onEditJob) {
      onEditJob(job);
    } else {
      console.error('onEditJob prop is not provided'); // Debug log
    }
  };

  const handleDeleteClick = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await onDeleteJob(jobId);
        // Refresh the jobs list after deletion
        fetchJobs();
      } catch (err) {
        console.error('Error deleting job:', err);
      }
    }
  };

  const handleApply = (job) => {
    setSelectedJob(job);
  };

  const handleApplicationSuccess = () => {
    fetchJobs(); // Refresh the job list after successful application
    setSelectedJob(null);
  };

  const handleCloseApplicationForm = () => {
    setSelectedJob(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>;
  }

  if (error) {
    return <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
      Error: {error}
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Available Jobs</h1>
      
      {/* Quick Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search jobs by title, company, location, or skills..."
            className="w-full px-6 py-4 text-lg border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm pl-12"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Advanced Filters</h2>
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={searchParams.location}
                onChange={handleSearchChange}
                placeholder="Enter location"
                className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                id="type"
                name="type"
                value={searchParams.type}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                id="experience"
                name="experience"
                value={searchParams.experience}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All Levels</option>
                <option value="ENTRY">Entry Level</option>
                <option value="MID">Mid Level</option>
                <option value="SENIOR">Senior Level</option>
                <option value="LEAD">Lead Level</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </form>

        {/* Post a New Job Button - Only visible to recruiters */}
        {user?.role === 'RECRUITER' && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onPostNewJob()}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Post a New Job
            </button>
          </div>
        )}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold">{job.title}</h2>
                {user?.role === 'RECRUITER' && job.recruiterId === user.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(job)}
                      className="text-teal-600 hover:text-teal-800"
                      title="Edit Job"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(job.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Job"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <p className="text-gray-600">{job.company}</p>
                <p className="text-gray-500">{job.location}</p>
                <p className="text-gray-500">{job.type}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Required Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills?.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-500 text-sm">
                  Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </span>
                {user?.role === 'CANDIDATE' && (
                  (() => {
                    console.log('Job:', job.title, 'Application Status:', job.applicationStatus);
                    return job.applicationStatus ? (
                      <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        job.applicationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        job.applicationStatus === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {job.applicationStatus}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(job)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                      >
                        Apply Now
                      </button>
                    );
                  })()
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedJob && (
        <JobApplicationForm
          job={selectedJob}
          onClose={handleCloseApplicationForm}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};

export default JobList; 