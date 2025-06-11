import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/job/applications', {
        withCredentials: true
      });
      setApplications(response.data.applications);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Applications fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWING':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">My Applications</h2>

      {error && (
        <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg mb-6">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h3>
          <p className="text-gray-500">You haven't applied to any jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <div key={application.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{application.job.title}</h3>
                  <p className="text-gray-600">{application.job.company}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                  {application.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600">Applied</p>
                  <p>{formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}</p>
                </div>
                <div>
                  <p className="text-gray-600">Location</p>
                  <p>{application.job.location}</p>
                </div>
                {application.expectedSalary && (
                  <div>
                    <p className="text-gray-600">Expected Salary</p>
                    <p>{application.expectedSalary}</p>
                  </div>
                )}
                {application.noticePeriod && (
                  <div>
                    <p className="text-gray-600">Notice Period</p>
                    <p>{application.noticePeriod}</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Cover Letter</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
              </div>

              <div className="flex justify-between items-center">
                <a
                  href={`http://localhost:3000/uploads/resumes/${application.resumePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Resume
                </a>
                {application.availableFrom && (
                  <p className="text-gray-600">
                    Available from: {new Date(application.availableFrom).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications; 