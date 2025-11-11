import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    role: 'CANDIDATE'
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        navigate('/login');
      } else {
        // Handle validation errors
        if (result.errors && Array.isArray(result.errors)) {
          const errorsObj = {};
          result.errors.forEach(err => {
            errorsObj[err.field] = err.message;
          });
          setFieldErrors(errorsObj);
          setError('Please fix the errors below');
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            <div className="font-semibold mb-1">{error}</div>
            {Object.keys(fieldErrors).length > 0 && (
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <li key={field}>
                    <span className="font-medium capitalize">{field}:</span> {message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                className={`input-field ${fieldErrors.firstname ? 'border-red-500 focus:ring-red-400' : ''}`}
                required
                disabled={isLoading}
              />
              {fieldErrors.firstname && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.firstname}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                className={`input-field ${fieldErrors.lastname ? 'border-red-500 focus:ring-red-400' : ''}`}
                required
                disabled={isLoading}
              />
              {fieldErrors.lastname && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.lastname}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`input-field ${fieldErrors.username ? 'border-red-500 focus:ring-red-400' : ''}`}
              required
              disabled={isLoading}
            />
            {fieldErrors.username && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input-field ${fieldErrors.email ? 'border-red-500 focus:ring-red-400' : ''}`}
              required
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input-field ${fieldErrors.password ? 'border-red-500 focus:ring-red-400' : ''}`}
              required
              disabled={isLoading}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
            {!fieldErrors.password && (
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
              disabled={isLoading}
            >
              <option value="CANDIDATE">Candidate</option>
              <option value="RECRUITER">Recruiter</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register; 