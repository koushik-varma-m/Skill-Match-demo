import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RecruiterApplications = () => {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/job/recruiter/applications', {
        withCredentials: true
      });
      setApplications(response.data);
    } catch (err) {
      setError('Failed to fetch applications');
      console.error('Applications fetch error:', err);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:3000/api/job/applications/${applicationId}/status`,
        { status: newStatus },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      // Refresh applications after update
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update application status');
      console.error('Status update error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Job Applications</h1>
      
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h3>
          <p className="text-gray-500">You haven't received any job applications yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{application.job.title}</h2>
                  <p className="text-gray-600">Company: {application.job.company}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                  {application.status}
                </span>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Applicant Details</h3>
                <p className="text-gray-700">Name: {application.candidate.name}</p>
                <p className="text-gray-700">Email: {application.candidate.email}</p>
                <p className="text-gray-700">Expected Salary: ${application.expectedSalary}</p>
                <p className="text-gray-700">Notice Period: {application.noticePeriod} days</p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Cover Letter</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Resume</h3>
                <a 
                  href={`http://localhost:3000${application.resumeUrl}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Resume
                </a>
              </div>

              <div className="flex justify-end space-x-4">
                {application.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(application.id, 'ACCEPTED')}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(application.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruiterApplications; 