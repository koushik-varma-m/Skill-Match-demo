import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MatchScore from '../components/MatchScore';

const JobDetails = () => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}/match`, {
        withCredentials: true
      });
      setJob(response.data);
    } catch (err) {
      setError('Failed to load job details');
      console.error('Job details fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await axios.post(`/api/jobs/${jobId}/apply`, {}, {
        withCredentials: true
      });
      fetchJobDetails(); // Refresh job details to update application status
    } catch (err) {
      setError('Failed to apply for job');
      console.error('Job application error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
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

  if (!job) {
    return (
      <div className="text-center text-gray-600 p-4">
        Job not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
            <p className="text-gray-600">{job.company.name}</p>
          </div>
          {user?.role === 'CANDIDATE' && (
            <div className="flex items-center space-x-4">
              {job.matchScore !== undefined && (
                <MatchScore score={job.matchScore} />
              )}
              {!job.hasApplied ? (
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Apply Now
                </button>
              ) : (
                <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                  {job.applicationStatus === 'PENDING' && 'Application Pending'}
                  {job.applicationStatus === 'ACCEPTED' && 'Application Accepted'}
                  {job.applicationStatus === 'REJECTED' && 'Application Rejected'}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Requirements</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Location</h2>
            <p className="text-gray-700">{job.location}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Salary</h2>
            <p className="text-gray-700">{job.salary}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Type</h2>
            <p className="text-gray-700">{job.type}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails; 