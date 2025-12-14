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
  const [jobDescriptionMode, setJobDescriptionMode] = useState('custom');
  const [modelUsed, setModelUsed] = useState(null);
  const [improvementSuggestions, setImprovementSuggestions] = useState(null);
  const [jobSummary, setJobSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId || jobDescriptionMode !== 'select') return;
    
    const job = jobs.find(j => j.id === parseInt(selectedJobId));
    if (!job) return;

    let desc = job.description || '';
    if (job.requirements?.length) {
      const reqText = Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements;
      desc += '\n\nRequirements: ' + reqText;
    }
    if (job.skills?.length) {
      const skillsText = Array.isArray(job.skills) ? job.skills.join(', ') : job.skills;
      desc += '\n\nSkills: ' + skillsText;
    }
    setJobDescription(desc);
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
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExts = ['.pdf', '.doc', '.docx'];

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setError('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setResumeFile(file);
    setError('');
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
        setSimilarityScore(response.data.similarityScore);
        setMatchedKeywords(response.data.matchedKeywords || []);
        setMissingKeywords(response.data.missingKeywords || []);
        setModelUsed(response.data.modelUsed || 'openai');
        if (response.data.improvementSuggestions) {
          setImprovementSuggestions(response.data.improvementSuggestions);
        }
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

  const getScoreStyle = (score) => {
    if (score >= 80) return { color: 'bg-green-500', text: 'text-green-600', stroke: '#10b981', msg: 'Excellent Match!' };
    if (score >= 60) return { color: 'bg-teal-500', text: 'text-teal-600', stroke: '#14b8a6', msg: 'Good Match' };
    if (score >= 40) return { color: 'bg-yellow-500', text: 'text-yellow-600', stroke: '#eab308', msg: 'Moderate Match' };
    return { color: 'bg-red-500', text: 'text-red-600', stroke: '#ef4444', msg: 'Poor Match' };
  };

  const summarizeJobDescription = async () => {
    const trimmed = jobDescription?.trim();
    if (!trimmed) {
      setError('Please enter a job description first');
      return;
    }

    setLoadingSummary(true);
    setJobSummary(null);
    setError('');

    try {
      const formData = new FormData();
      formData.append('text', trimmed);
      formData.append('text_type', 'job_description');

      const res = await axios.post('http://localhost:8000/summarize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.summary) {
        setJobSummary(res.data.summary);
      }
    } catch (err) {
      setError('Failed to summarize job description. Please try again.');
    } finally {
      setLoadingSummary(false);
    }
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
    setModelUsed(null);
    setImprovementSuggestions(null);
    setJobSummary(null);
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
                    setSelectedJobId(''); 
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
                    if (!selectedJobId) {
                      setJobDescription('');
                    }
                  }}
                  className="mr-2 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Select from Jobs</span>
              </label>
            </div>

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
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-500">
                  {jobDescription.length} characters
                  {jobDescriptionMode === 'select' && selectedJobId && (
                    <span className="ml-2 text-teal-600">
                      • Auto-filled from job posting
                    </span>
                  )}
                </p>
                {jobDescription.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={summarizeJobDescription}
                    disabled={loadingSummary}
                    className="text-sm px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                  >
                    {loadingSummary ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Summarizing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>AI Summarize</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {jobSummary && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-semibold text-blue-900 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Job Summary (AI Generated)
                    </h4>
                    <button
                      onClick={() => setJobSummary(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">{jobSummary.summary}</p>
                  {jobSummary.key_skills && jobSummary.key_skills.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-blue-900 mb-2">Key Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {jobSummary.key_skills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobSummary.key_responsibilities && jobSummary.key_responsibilities.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-blue-900 mb-2">Key Responsibilities:</p>
                      <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                        {jobSummary.key_responsibilities.slice(0, 5).map((resp, idx) => (
                          <li key={idx}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

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

        {similarityScore !== null && (
          <div className="mt-8 p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border-2 border-teal-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Match Score</h2>
            
            {modelUsed && (
              <div className="text-center mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  Powered by OpenAI
                </span>
              </div>
            )}
            
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={getScoreStyle(similarityScore).stroke}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(similarityScore / 100) * 339.292} 339.292`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className={`text-3xl font-bold ${getScoreStyle(similarityScore).text}`}>
                      {similarityScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Similarity Score</span>
                <span className={`text-sm font-bold ${getScoreStyle(similarityScore).text}`}>
                  {similarityScore.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full ${getScoreStyle(similarityScore).color} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2`}
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

            <div className="text-center">
              <p className={`text-lg font-semibold ${getScoreStyle(similarityScore).text} mb-2`}>
                {getScoreStyle(similarityScore).msg}
              </p>
              <p className="text-sm text-gray-600">
                Your resume matches {similarityScore.toFixed(1)}% of the job description requirements
              </p>
            </div>

            {improvementSuggestions && (
              <div className="mt-6 pt-6 border-t border-teal-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI-Powered Improvement Suggestions
                </h3>
                
                {improvementSuggestions.suggestions && improvementSuggestions.suggestions.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-purple-900 mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {improvementSuggestions.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-purple-800 flex items-start">
                          <svg className="w-5 h-5 mr-2 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {improvementSuggestions.actionable_items && improvementSuggestions.actionable_items.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-green-900 mb-3">Actionable Items to Add</h4>
                    <ul className="space-y-2">
                      {improvementSuggestions.actionable_items.map((item, idx) => (
                        <li key={idx} className="text-sm text-green-800 flex items-start">
                          <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {improvementSuggestions.keywords_to_add && improvementSuggestions.keywords_to_add.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Keywords to Add</h4>
                    <div className="flex flex-wrap gap-2">
                      {improvementSuggestions.keywords_to_add.map((keyword, idx) => (
                        <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-300">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {improvementSuggestions.score_impact && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Expected Impact:</span> {improvementSuggestions.score_impact}
                    </p>
                  </div>
                )}
              </div>
            )}

            {similarityScore !== null && (
              <div className="mt-6 pt-6 border-t border-teal-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Keyword Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
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

