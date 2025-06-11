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
    navigate('/recruiter/applications');
  };

  const handleViewCandidates = () => {
    navigate('/connections');
  };

  const handlePostNewJob = () => {
    navigate('/jobs');
  };

  const handleSearchCandidates = () => {
    navigate('/connections');
  };

  const handleViewMessages = () => {
    navigate('/messages');
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user?.firstname}!</h1>
        <p className="text-gray-600">Your recruiter dashboard helps you manage job postings and candidates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Job Postings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Job Postings</h2>
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.activeJobs}</div>
          <p className="text-gray-600 mb-4">Currently active job postings</p>
          <button 
            onClick={handleManageJobs}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Manage Jobs
          </button>
        </div>

        {/* New Applications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">New Applications</h2>
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.newApplications}</div>
          <p className="text-gray-600 mb-4">Applications received today</p>
          <button 
            onClick={handleReviewApplications}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Review Applications
          </button>
        </div>

        {/* Candidate Pool */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Candidate Pool</h2>
          <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalCandidates}</div>
          <p className="text-gray-600 mb-4">Total candidates in your network</p>
          <button 
            onClick={handleViewCandidates}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Candidates
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button 
            onClick={handlePostNewJob}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Post New Job
          </button>
          <button 
            onClick={handleSearchCandidates}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Search Candidates
          </button>
          <button 
            onClick={handleViewMessages}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            View Messages
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard; 