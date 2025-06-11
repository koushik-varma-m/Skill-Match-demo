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
      formDataToSend.append('coverLetter', formData.coverLetter);
      formDataToSend.append('resume', formData.resume);
      formDataToSend.append('expectedSalary', formData.expectedSalary);
      formDataToSend.append('noticePeriod', formData.noticePeriod);
      formDataToSend.append('availableFrom', formData.availableFrom);

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
              Cover Letter *
            </label>
            <textarea
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleChange}
              required
              rows="6"
              className="input-field w-full"
              placeholder="Explain why you're a good fit for this role..."
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
              className="input-field w-full"
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
              className="input-field w-full"
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
              className="input-field w-full"
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
              className="input-field w-full"
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
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