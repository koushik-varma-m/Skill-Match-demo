import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeJobs: 0,
    newApplications: 0,
    totalCandidates: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/recruiter/dashboard/stats', {
          withCredentials: true
        });
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleManageJobs = () => {
    navigate('/jobs');
  };

  const handleReviewApplications = () => {
    navigate('/recruiter-applications');
  };

  const handleViewCandidates = () => {
    navigate('/connections');
  };

  const handlePostNewJob = () => {
    navigate('/jobs', { state: { showJobForm: true } });
  };

  const handleSearchCandidates = () => {
    navigate('/connections');
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user?.firstname}!</h1>
        <p className="text-gray-600">Your recruiter dashboard is here to help you manage your hiring process.</p>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Jobs</h3>
          <p className="text-3xl font-bold text-teal-600">{stats.activeJobs}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">New Applications</h3>
          <p className="text-3xl font-bold text-teal-600">{stats.newApplications}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Candidates</h3>
          <p className="text-3xl font-bold text-teal-600">{stats.totalCandidates}</p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Jobs</h2>
          <p className="text-gray-600 mb-4">View and manage your job postings.</p>
          <button
            onClick={handleManageJobs}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            View Jobs
          </button>
        </div>

        {}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Applications</h2>
          <p className="text-gray-600 mb-4">Review and manage job applications.</p>
          <button
            onClick={handleReviewApplications}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            View Applications
          </button>
        </div>

        {}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Post New Job</h2>
          <p className="text-gray-600 mb-4">Create a new job posting.</p>
          <button
            onClick={handlePostNewJob}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            Post Job
          </button>
        </div>

        {}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Candidates</h2>
          <p className="text-gray-600 mb-4">Find qualified candidates for your positions.</p>
          <button
            onClick={handleSearchCandidates}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            Search Candidates
          </button>
        </div>

        {}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Network</h2>
          <p className="text-gray-600 mb-4">Build your professional network.</p>
          <button
            onClick={handleViewCandidates}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md transition-colors duration-200"
          >
            View Network
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;