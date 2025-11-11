import { useState } from 'react';
import axios from 'axios';

const JobApplicationForm = ({ job, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    coverLetter: '',
    resume: null,
    expectedSalary: '',
    noticePeriod: '',
    availableFrom: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      resume: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.resume) {
        setError('Please select a resume file');
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      // Only append coverLetter if it's not empty
      if (formData.coverLetter && formData.coverLetter.trim()) {
        formDataToSend.append('coverLetter', formData.coverLetter.trim());
      }
      formDataToSend.append('resume', formData.resume);
      if (formData.expectedSalary) {
        formDataToSend.append('expectedSalary', formData.expectedSalary);
      }
      if (formData.noticePeriod) {
        formDataToSend.append('noticePeriod', formData.noticePeriod);
      }
      if (formData.availableFrom) {
        formDataToSend.append('availableFrom', formData.availableFrom);
      }

      console.log('Sending form data:', {
        coverLetter: formData.coverLetter,
        resume: formData.resume.name,
        expectedSalary: formData.expectedSalary,
        noticePeriod: formData.noticePeriod,
        availableFrom: formData.availableFrom
      });

      const response = await axios.post(
        `http://localhost:3000/api/job/${job.id}/apply`,
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Application response:', response.data);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Application error:', err);
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Apply for {job.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Letter
            </label>
            <textarea
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleChange}
              rows="6"
              className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
              placeholder="Explain why you're a good fit for this role (optional)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume/CV *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              required
              className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Accepted formats: PDF, DOC, DOCX (Max size: 5MB)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Salary
            </label>
            <input
              type="text"
              name="expectedSalary"
              value={formData.expectedSalary}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., $80,000 per annum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notice Period
            </label>
            <input
              type="text"
              name="noticePeriod"
              value={formData.noticePeriod}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., 1 month"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available From
            </label>
            <input
              type="date"
              name="availableFrom"
              value={formData.availableFrom}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApplicationForm; 