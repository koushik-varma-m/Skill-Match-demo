import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MatchScore from '../components/MatchScore';
import JobApplicationForm from '../components/JobApplicationForm';
import { formatDistanceToNow } from 'date-fns';

const JobDetails = () => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleViewProfile = (userId) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/job/${jobId}`, {
        withCredentials: true
      });
      setJob(response.data.job);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job details');
      console.error('Job details fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false);
    fetchJobDetails(); 
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
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center text-gray-600 p-8 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Job not found</h2>
          <Link to="/jobs" className="text-teal-600 hover:text-teal-700">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const hasApplied = job.applications && job.applications.length > 0;
  const applicationStatus = hasApplied ? job.applications[0]?.status : null;

  const renderRequirements = () => {
    if (Array.isArray(job.requirements)) {
      return (
        <ul className="list-disc list-inside space-y-2">
          {job.requirements.map((req, index) => (
            <li key={index} className="text-gray-700">{req}</li>
          ))}
        </ul>
      );
    }
    return <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>;
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <Link 
        to="/jobs" 
        className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-4"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Jobs
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-8 border-b border-teal-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-xl text-gray-700 mb-4">{job.company}</p>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{job.type}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{job.salary}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            {user?.role === 'CANDIDATE' && (
              <div className="flex flex-col items-end space-y-3 ml-4">
                {job.matchScore !== undefined && (
                  <MatchScore score={job.matchScore} />
                )}
                {!hasApplied ? (
                  <button
                    onClick={() => setShowApplicationForm(true)}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200 font-semibold text-lg shadow-md"
                  >
                    Apply Now
                  </button>
                ) : (
                  <div className="px-6 py-3 rounded-lg font-semibold text-lg">
                    <span className={`px-4 py-2 rounded-lg ${
                      applicationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      applicationStatus === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      applicationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {applicationStatus === 'PENDING' && 'Application Pending'}
                      {applicationStatus === 'ACCEPTED' && 'Application Accepted'}
                      {applicationStatus === 'REJECTED' && 'Application Rejected'}
                      {applicationStatus === 'REVIEWING' && 'Under Review'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Job Description
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Requirements
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              {renderRequirements()}
            </div>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Skills
              </h2>
              <div className="flex flex-wrap gap-3">
                {job.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-medium shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {job.experience && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Experience Level
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 font-medium">{job.experience}</p>
                </div>
              </div>
            )}

            {job.education && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v7" />
                  </svg>
                  Education
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 font-medium">{job.education}</p>
                </div>
              </div>
            )}
          </div>

          {job.recruiter && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Posted by</h2>
              <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                <div 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleViewProfile(job.recruiter.id)}
                >
                  {job.recruiter.profile?.profilePicture ? (
                    <img 
                      src={`http://localhost:3000${job.recruiter.profile.profilePicture}`} 
                      alt={`${job.recruiter.firstname} ${job.recruiter.lastname}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-teal-600 text-xl font-semibold">
                        {job.recruiter.firstname?.[0]}{job.recruiter.lastname?.[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p 
                    className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-teal-600 transition-colors"
                    onClick={() => handleViewProfile(job.recruiter.id)}
                  >
                    {job.recruiter.firstname} {job.recruiter.lastname}
                  </p>
                  <p className="text-gray-600">{job.recruiter.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Apply for {job.title}</h2>
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
              job={job}
              onSuccess={handleApplicationSuccess}
              onClose={() => setShowApplicationForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails; 