import { useState, useEffect } from 'react';
import axios from 'axios';

const ResumeMatch = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(null);
  const [matchedKeywords, setMatchedKeywords] = useState([]);
  const [missingKeywords, setMissingKeywords] = useState([]);
  const [error, setError] = useState('');
  const [jobDescriptionMode, setJobDescriptionMode] = useState('custom'); // 'custom' or 'select'

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId && jobDescriptionMode === 'select') {
      const selectedJob = jobs.find(job => job.id === Number.parseInt(selectedJobId, 10));
      if (selectedJob) {
        // Combine description, requirements, and skills into a comprehensive job description
        let combinedDescription = selectedJob.description || '';
        
        // Add requirements if they exist
        if (selectedJob.requirements && selectedJob.requirements.length > 0) {
          const requirementsText = Array.isArray(selectedJob.requirements) 
            ? selectedJob.requirements.join(', ') 
            : selectedJob.requirements;
          combinedDescription += '\n\nRequirements: ' + requirementsText;
        }
        
        // Add skills if they exist
        if (selectedJob.skills && selectedJob.skills.length > 0) {
          const skillsText = Array.isArray(selectedJob.skills) 
            ? selectedJob.skills.join(', ') 
            : selectedJob.skills;
          combinedDescription += '\n\nSkills: ' + skillsText;
        }
        
        setJobDescription(combinedDescription);
      }
    }
  }, [selectedJobId, jobDescriptionMode, jobs]);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await axios.get('/api/job/all', {
        withCredentials: true
      });
      setJobs(response.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError('Please upload a PDF, DOC, or DOCX file');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setResumeFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSimilarityScore(null);
    setMatchedKeywords([]);
    setMissingKeywords([]);

    try {
      if (!resumeFile) {
        setError('Please select a resume file');
        setLoading(false);
        return;
      }

      if (!jobDescription || jobDescription.trim().length === 0) {
        setError('Please enter or select a job description');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('resumeFile', resumeFile);
      formData.append('jobDescription', jobDescription.trim());

      const response = await axios.post(
        '/api/resume-match',
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        console.log('Full response:', response.data);
        setSimilarityScore(response.data.similarityScore);
        setMatchedKeywords(response.data.matchedKeywords || []);
        setMissingKeywords(response.data.missingKeywords || []);
        console.log('Matched keywords:', response.data.matchedKeywords);
        console.log('Missing keywords:', response.data.missingKeywords);
      } else {
        setError(response.data.message || 'Failed to analyze resume');
      }
    } catch (err) {
      console.error('Resume match error:', err);
      setError(err.response?.data?.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-teal-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreStrokeColor = (score) => {
    if (score >= 80) return '#10b981'; // green-500
    if (score >= 60) return '#14b8a6'; // teal-500
    if (score >= 40) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent Match!';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Moderate Match';
    return 'Poor Match';
  };

  const getScoreTextColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-teal-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const resetForm = () => {
    setResumeFile(null);
    setJobDescription('');
    setSelectedJobId('');
    setSimilarityScore(null);
    setMatchedKeywords([]);
    setMissingKeywords([]);
    setError('');
    setJobDescriptionMode('custom');
    // Reset file input
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Resume Match Analyzer</h1>
        <p className="text-gray-600 mb-6">
          Upload your resume and compare it with a job description to see how well you match
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume File Upload */}
          <div>
            <label htmlFor="resume-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Resume/CV <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-teal-400 transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="resume-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="resume-upload"
                      name="resume-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="sr-only"
                      required
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX up to 10MB
                </p>
                {resumeFile && (
                  <p className="text-sm text-teal-600 font-medium mt-2">
                    Selected: {resumeFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Job Description Mode Selection */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Job Description Source <span className="text-red-500">*</span>
            </div>
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="jobDescriptionMode"
                  value="custom"
                  checked={jobDescriptionMode === 'custom'}
                  onChange={(e) => {
                    setJobDescriptionMode(e.target.value);
                    setSelectedJobId(''); // Clear selected job when switching to custom
                  }}
                  className="mr-2 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Enter Custom Description</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="jobDescriptionMode"
                  value="select"
                  checked={jobDescriptionMode === 'select'}
                  onChange={(e) => {
                    setJobDescriptionMode(e.target.value);
                    // Clear description when switching to select mode so it can be auto-filled
                    if (!selectedJobId) {
                      setJobDescription('');
                    }
                  }}
                  className="mr-2 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Select from Jobs</span>
              </label>
            </div>

            {/* Job Selection */}
            {jobDescriptionMode === 'select' && (
              <div className="mb-4">
                <label htmlFor="job-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Job
                </label>
                {loadingJobs ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                  </div>
                ) : (
                  <select
                    id="job-select"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">-- Select a job --</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} - {job.company}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Job Description Text Area */}
            <div>
              <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description <span className="text-red-500">*</span>
                {jobDescriptionMode === 'select' && selectedJobId && (
                  <span className="ml-2 text-xs text-teal-600 font-normal">
                    (Includes description, requirements, and skills)
                  </span>
                )}
              </label>
              <textarea
                id="job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 resize-vertical"
                placeholder={
                  jobDescriptionMode === 'select'
                    ? 'Select a job above to automatically fill the description, requirements, and skills, or edit it here...'
                    : 'Enter the job description, requirements, and skills here...'
                }
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {jobDescription.length} characters
                {jobDescriptionMode === 'select' && selectedJobId && (
                  <span className="ml-2 text-teal-600">
                    • Auto-filled from job posting
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading || !resumeFile || !jobDescription.trim()}
              className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Analyze Resume</span>
              )}
            </button>
          </div>
        </form>

        {/* Similarity Score Display */}
        {similarityScore !== null && (
          <div className="mt-8 p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border-2 border-teal-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Match Score</h2>
            
            {/* Circular Progress Indicator */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={getScoreStrokeColor(similarityScore)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(similarityScore / 100) * 339.292} 339.292`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className={`text-3xl font-bold ${getScoreTextColor(similarityScore)}`}>
                      {similarityScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Similarity Score</span>
                <span className={`text-sm font-bold ${getScoreTextColor(similarityScore)}`}>
                  {similarityScore.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full ${getScoreColor(similarityScore)} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2`}
                  style={{ width: `${similarityScore}%` }}
                >
                  {similarityScore > 10 && (
                    <span className="text-xs text-white font-medium">
                      {similarityScore.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score Message */}
            <div className="text-center">
              <p className={`text-lg font-semibold ${getScoreTextColor(similarityScore)} mb-2`}>
                {getScoreMessage(similarityScore)}
              </p>
              <p className="text-sm text-gray-600">
                Your resume matches {similarityScore.toFixed(1)}% of the job description requirements
              </p>
            </div>

            {/* Keywords Analysis */}
            {similarityScore !== null && (
              <div className="mt-6 pt-6 border-t border-teal-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Keyword Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Matched Keywords */}
                  {matchedKeywords.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Matched Keywords ({matchedKeywords.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {matchedKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-green-700 mt-2">
                        These keywords from the job description were found in your resume.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Matched Keywords</h4>
                      <p className="text-xs text-gray-500">No matched keywords found.</p>
                    </div>
                  )}

                  {/* Missing Keywords */}
                  {missingKeywords.length > 0 ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Missing Keywords ({missingKeywords.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {missingKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-red-700 mt-2">
                        Consider adding these keywords to improve your resume match.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Missing Keywords</h4>
                      <p className="text-xs text-gray-500">No missing keywords. Great match!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Score Interpretation */}
            <div className="mt-6 pt-6 border-t border-teal-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Score Interpretation:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <span className="font-medium text-green-600">80-100%:</span> Excellent match - Your resume strongly aligns with the job requirements
                </li>
                <li>
                  <span className="font-medium text-teal-600">60-79%:</span> Good match - Your resume matches most of the job requirements
                </li>
                <li>
                  <span className="font-medium text-yellow-600">40-59%:</span> Moderate match - Consider highlighting more relevant skills and experience
                </li>
                <li>
                  <span className="font-medium text-red-600">0-39%:</span> Poor match - Significant gaps between your resume and job requirements
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-white text-teal-600 border border-teal-600 rounded-md hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
              >
                Analyze Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeMatch;

