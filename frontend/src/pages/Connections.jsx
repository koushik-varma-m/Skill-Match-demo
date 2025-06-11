import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchConnections();
    fetchSentRequests();
    fetchReceivedRequests();
    fetchSuggestions();
  }, []);

  const fetchConnections = async () => {
    try {
      console.log('Fetching connections...');
      const response = await axios.get('http://localhost:3000/api/connection/connected', {
        withCredentials: true
      });
      console.log('Connections response:', response.data);
      setConnections(response.data?.connection || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to load connections');
      setConnections([]);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/connection/requests/sent', {
        withCredentials: true
      });
      setSentRequests(response.data?.connection || []);
    } catch (err) {
      console.error('Error fetching sent requests:', err);
      setSentRequests([]);
    }
  };

  const fetchReceivedRequests = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/connection/requests/received', {
        withCredentials: true
      });
      console.log('Received requests response:', response.data);
      // The response might be nested under a property, let's handle both cases
      const requests = response.data?.connection || response.data || [];
      setReceivedRequests(requests);
    } catch (err) {
      console.error('Error fetching received requests:', err);
      setReceivedRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      console.log('Fetching suggestions...');
      const response = await axios.get('http://localhost:3000/api/user/suggestions', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Suggestions response:', response.data);
      setSuggestions(response.data);
    } catch (err) {
      console.error('Error fetching suggestions:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Failed to load suggestions');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/user/search?q=${searchQuery}`, {
        withCredentials: true
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await axios.post(`http://localhost:3000/api/connection/request/${userId}`, {}, {
        withCredentials: true
      });
      setError('');
      // Update the search results to reflect the sent request
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, connectionStatus: 'PENDING' }
            : user
        )
      );
      fetchSentRequests();
    } catch (err) {
      console.error('Error sending request:', err);
      setError(err.response?.data?.message || 'Failed to send connection request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      // Debug logging
      console.log('=== Accept Request Debug ===');
      console.log('Request ID:', requestId);
      console.log('Current user:', user);
      console.log('Received requests:', receivedRequests);

      // Validate request ID
      if (!requestId) {
        console.error('No request ID provided');
        setError('Invalid request ID');
        return;
      }

      // Find the request in our local state
      const request = receivedRequests.find(r => r.id === requestId);
      console.log('Found request in local state:', request);

      if (!request) {
        console.error('Request not found in local state');
        setError('Request not found');
        return;
      }

      const response = await axios.put(
        `http://localhost:3000/api/connection/accept/${requestId}`, 
        {}, 
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Accept request response:', response.data);
      
      // Refresh all connection-related data
      await Promise.all([
        fetchConnections(),
        fetchReceivedRequests(),
        fetchSentRequests()
      ]);

      // Clear any existing error
      setError('');
    } catch (err) {
      console.error('Error accepting request:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        requestId,
        userId: user?.id,
        receivedRequests
      });
      setError(err.response?.data?.message || 'Failed to accept connection request');
    }
  };

  const handleRemoveConnection = async (requestId) => {
    try {
      await axios.put(`http://localhost:3000/api/connection/remove/${requestId}`, {}, {
        withCredentials: true
      });
      fetchConnections();
      fetchSentRequests();
      fetchReceivedRequests();
    } catch (err) {
      console.error('Error removing connection:', err);
      setError('Failed to remove connection');
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
      {error && (
        <div key="error-message" className="text-center text-red-600 p-4 bg-red-50 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Search Section */}
      <div key="search-section" className="mb-8">
        <h2 className="text-xl font-bold mb-4">Find People</h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 input-field"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        {searchLoading ? (
          <div key="search-loading" className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {searchResults.map((result) => (
              <div key={`search-${result.id}`} className="card">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {result.profile?.profilePicture ? (
                      <img
                        src={`http://localhost:3000${result.profile.profilePicture}`}
                        alt={result.firstname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {result.firstname[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{result.firstname} {result.lastname}</h3>
                    <p className="text-sm text-gray-600">{result.email}</p>
                    <p className="text-sm text-gray-500 capitalize">{result.role.toLowerCase()}</p>
                  </div>
                  {result.id !== user?.id && (
                    <button
                      onClick={() => handleSendRequest(result.id)}
                      disabled={result.connectionStatus === 'PENDING' || result.connectionStatus === 'CONNECTED'}
                      className={`btn-primary text-sm ${
                        result.connectionStatus === 'PENDING' ? 'bg-gray-400' :
                        result.connectionStatus === 'CONNECTED' ? 'bg-green-600' : ''
                      }`}
                    >
                      {result.connectionStatus === 'PENDING' ? 'Request Sent' :
                       result.connectionStatus === 'CONNECTED' ? 'Connected' :
                       'Connect'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && (
          <div key="no-search-results" className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No users found matching your search</p>
          </div>
        )}
      </div>

      {/* Suggested Connections */}
      <div key="suggestions-section" className="mb-8">
        <h2 className="text-xl font-bold mb-4">Suggested Connections</h2>
        {suggestionsLoading ? (
          <div key="suggestions-loading" className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((suggestion) => (
              <div key={`suggestion-${suggestion.id}`} className="card">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {suggestion.profile?.profilePicture ? (
                      <img
                        src={`http://localhost:3000${suggestion.profile.profilePicture}`}
                        alt={suggestion.firstname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {suggestion.firstname[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{suggestion.firstname} {suggestion.lastname}</h3>
                    <p className="text-sm text-gray-600">{suggestion.email}</p>
                    <p className="text-sm text-gray-500 capitalize">{suggestion.role.toLowerCase()}</p>
                    {suggestion.matchingSkills && suggestion.matchingSkills.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Matching Skills:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.matchingSkills.map((skill, index) => (
                            <span key={`skill-${suggestion.id}-${index}`} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {suggestion.id !== user?.id && (
                    <button
                      onClick={() => handleSendRequest(suggestion.id)}
                      disabled={suggestion.connectionStatus === 'PENDING' || suggestion.connectionStatus === 'CONNECTED'}
                      className={`btn-primary text-sm ${
                        suggestion.connectionStatus === 'PENDING' ? 'bg-gray-400' :
                        suggestion.connectionStatus === 'CONNECTED' ? 'bg-green-600' : ''
                      }`}
                    >
                      {suggestion.connectionStatus === 'PENDING' ? 'Request Sent' :
                       suggestion.connectionStatus === 'CONNECTED' ? 'Connected' :
                       'Connect'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div key="no-suggestions" className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No suggestions available at the moment</p>
          </div>
        )}
      </div>

      {/* Sent Connection Requests */}
      {sentRequests?.length > 0 && (
        <div key="sent-requests-section" className="mb-8">
          <h2 className="text-xl font-bold mb-4">Sent Requests</h2>
          <div className="space-y-4">
            {sentRequests
              .filter(request => request && request.id) // Filter out invalid requests
              .map((request, index) => (
                <div 
                  key={`sent-${request.id || `temp-${index}`}`} 
                  className="card flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">{request.Name || 'Unknown User'}</h3>
                    <p className="text-gray-600">Request {request.status?.toLowerCase() || 'pending'}</p>
                  </div>
                  {request.status === 'PENDING' && (
                    <button
                      onClick={() => handleRemoveConnection(request.id)}
                      className="btn-secondary"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Received Connection Requests */}
      {receivedRequests?.filter(request => request && request.status === 'PENDING').length > 0 && (
        <div key="received-requests-section" className="mb-8">
          <h2 className="text-xl font-bold mb-4">Connection Requests</h2>
          <div className="space-y-4">
            {receivedRequests
              .filter(request => request && request.id && request.status === 'PENDING')
              .map((request, index) => (
                <div 
                  key={`received-${request.id || `temp-${index}`}`} 
                  className="card flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">{request.Name || 'Unknown User'}</h3>
                    <p className="text-gray-600">Wants to connect with you</p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="btn-primary"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRemoveConnection(request.id)}
                      className="btn-secondary"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Connections List */}
      <div key="connections-section">
        <h2 className="text-xl font-bold mb-4">Your Connections</h2>
        {!connections || connections.length === 0 ? (
          <div key="no-connections" className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Connections Yet</h3>
            <p className="text-gray-500">Start connecting with other professionals!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {connections
              .filter(connection => connection && connection.id) // Filter out invalid connections
              .map((connection, index) => {
                console.log('Connection data:', connection); // Debug log
                return (
                  <div 
                    key={`connection-${connection.id || `temp-${index}`}`} 
                    className="card"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                        {connection.profile?.profilePicture ? (
                          <img
                            src={`http://localhost:3000${connection.profile.profilePicture}`}
                            alt={connection.firstname || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {(connection.firstname?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{connection.firstname || 'Unknown User'}</h3>
                        <button
                          onClick={() => {
                            console.log('Removing connection:', connection); // Debug log
                            handleRemoveConnection(connection.connectionId || connection.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove Connection
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections; 