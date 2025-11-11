import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleViewProfile = (userId) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchConnections();
      const requests = await fetchSentRequests();
      await fetchReceivedRequests();
      // Get user IDs from sent requests to exclude from suggestions
      const excludeUserIds = requests
        .map(req => req.receiverId || (req.receiver && req.receiver.id))
        .filter(id => id !== undefined);
      // Fetch suggestions after sent requests so we can filter them
      await fetchSuggestions(excludeUserIds);
    };
    loadData();
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
      console.log('=== Fetching Sent Requests ===');
      const response = await axios.get('http://localhost:3000/api/connection/requests/sent', {
        withCredentials: true
      });
      console.log('Sent requests response:', response.data);
      console.log('Response status:', response.status);
      const requests = response.data?.connection || response.data || [];
      console.log('Parsed sent requests:', requests);
      console.log('Number of sent requests:', requests.length);
      if (requests.length > 0) {
        console.log('First sent request:', requests[0]);
      }
      setSentRequests(requests);
      return requests;
    } catch (err) {
      console.error('Error fetching sent requests:', err);
      console.error('Error response:', err.response?.data);
      setSentRequests([]);
      return [];
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

  const fetchSuggestions = async (excludeUserIds = []) => {
    try {
      console.log('Fetching suggestions...', excludeUserIds.length > 0 ? `(excluding ${excludeUserIds.length} users)` : '');
      const response = await axios.get('http://localhost:3000/api/user/suggestions', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Suggestions response:', response.data);
      let suggestions = response.data || [];
      
      // Filter out users who are already in sent requests (fallback check)
      if (excludeUserIds.length > 0) {
        const excludeSet = new Set(excludeUserIds);
        console.log('Filtering suggestions - excluding user IDs:', Array.from(excludeSet));
        const beforeCount = suggestions.length;
        suggestions = suggestions.filter(suggestion => !excludeSet.has(suggestion.id));
        console.log(`Suggestions filtered: ${beforeCount} -> ${suggestions.length}`);
      }
      
      setSuggestions(suggestions);
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
      console.log('Sending connection request to user:', userId);
      const response = await axios.post(`http://localhost:3000/api/connection/request/${userId}`, {}, {
        withCredentials: true
      });
      console.log('Connection request sent successfully:', response.data);
      setError('');
      
      const connectionData = response.data;
      console.log('Full connection data:', JSON.stringify(connectionData, null, 2));
      
      // Get receiver ID - Prisma includes receiverId in the response
      const receiverId = connectionData.receiverId || (connectionData.receiver && connectionData.receiver.id);
      
      if (!receiverId) {
        console.error('No receiver ID in response:', connectionData);
        // Fallback: fetch sent requests after a delay
        setTimeout(async () => {
          await fetchSentRequests();
        }, 500);
        return;
      }
      
      // Get receiver info from response
      const receiverInfo = connectionData.receiver;
      
      // Remove user from suggestions immediately (do this regardless of receiver info)
      setSuggestions(prev => {
        const filtered = prev.filter(user => user.id !== userId);
        console.log('Removed user from suggestions. Remaining:', filtered.length);
        return filtered;
      });
      
      // Update the search results to reflect the sent request
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, connectionStatus: 'PENDING' }
            : user
        )
      );
      
      if (receiverInfo) {
        // Create sent request object from response
        const newSentRequest = {
          id: connectionData.id,
          receiverId: receiverId,
          Name: receiverInfo.firstname || 'Unknown User',
          status: connectionData.status || 'PENDING',
          receiver: receiverInfo
        };
        
        console.log('Adding sent request to state:', newSentRequest);
        
        // Update sent requests state immediately
        setSentRequests(prev => {
          // Check if this request already exists
          const exists = prev.some(req => req.id === newSentRequest.id || req.receiverId === receiverId);
          if (exists) {
            console.log('Request already exists in state, updating...');
            return prev.map(req => 
              req.id === newSentRequest.id || req.receiverId === receiverId 
                ? newSentRequest 
                : req
            );
          }
          console.log('Adding new request to state');
          return [...prev, newSentRequest];
        });
        
        // Refresh sent requests from backend after a delay to ensure we have the latest data
        setTimeout(async () => {
          console.log('Refreshing sent requests from backend to sync...');
          await fetchSentRequests();
        }, 300);
      } else {
        console.warn('No receiver info in response, fetching from backend...');
        // Fallback: fetch sent requests to get full data
        setTimeout(async () => {
          await fetchSentRequests();
        }, 300);
      }
      
      // Refresh suggestions after a delay to ensure backend has updated and excludes this user
      setTimeout(() => {
        console.log('Refreshing suggestions from backend...');
        fetchSuggestions([receiverId]);
      }, 800);
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
        fetchSentRequests(),
        fetchSuggestions() // Refresh suggestions since user is now connected
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
      // Refresh all connection-related data
      await Promise.all([
        fetchConnections(),
        fetchSentRequests(),
        fetchReceivedRequests(),
        fetchSuggestions() // Refresh suggestions so the user can appear again
      ]);
      setError('');
    } catch (err) {
      console.error('Error removing connection:', err);
      setError('Failed to remove connection');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-teal-600"></div>
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
          <button type="submit" className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md font-medium transition-colors duration-200">
            Search
          </button>
        </form>

        {searchLoading ? (
          <div key="search-loading" className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-teal-600"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {searchResults.map((result) => (
              <div key={`search-${result.id}`} className="card">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleViewProfile(result.id)}
                  >
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
                    <h3 
                      className="font-semibold cursor-pointer hover:text-teal-600 transition-colors"
                      onClick={() => handleViewProfile(result.id)}
                    >
                      {result.firstname} {result.lastname}
                    </h3>
                    <p className="text-sm text-gray-600">{result.email}</p>
                    <p className="text-sm text-gray-500 capitalize">{result.role.toLowerCase()}</p>
                  </div>
                  {result.id !== user?.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendRequest(result.id);
                      }}
                      disabled={result.connectionStatus === 'PENDING' || result.connectionStatus === 'CONNECTED'}
                      className={`bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
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
            <div className="animate-spin rounded-full h-8 w-8 border-teal-600"></div>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((suggestion) => (
              <div key={`suggestion-${suggestion.id}`} className="card">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleViewProfile(suggestion.id)}
                  >
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
                    <h3 
                      className="font-semibold cursor-pointer hover:text-teal-600 transition-colors"
                      onClick={() => handleViewProfile(suggestion.id)}
                    >
                      {suggestion.firstname} {suggestion.lastname}
                    </h3>
                    <p className="text-sm text-gray-600">{suggestion.email}</p>
                    <p className="text-sm text-gray-500 capitalize">{suggestion.role.toLowerCase()}</p>
                    {suggestion.matchingSkills && suggestion.matchingSkills.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Matching Skills:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.matchingSkills.map((skill, index) => (
                            <span key={`skill-${suggestion.id}-${index}`} className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {suggestion.id !== user?.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendRequest(suggestion.id);
                      }}
                      className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={sentRequests.some(req => 
                        (req.receiverId === suggestion.id) || 
                        (req.receiver && req.receiver.id === suggestion.id)
                      )}
                    >
                      {sentRequests.some(req => 
                        (req.receiverId === suggestion.id) || 
                        (req.receiver && req.receiver.id === suggestion.id)
                      ) ? 'Request Sent' : 'Connect'}
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
      <div key="sent-requests-section" className="mb-8">
        <h2 className="text-xl font-bold mb-4">Sent Requests</h2>
        {sentRequests && Array.isArray(sentRequests) && sentRequests.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {sentRequests
              .filter(request => request && request.id)
              .map((request, index) => {
                const receiver = request.receiver || null;
                const displayName = receiver 
                  ? (receiver.firstname && receiver.lastname ? `${receiver.firstname} ${receiver.lastname}` : receiver.firstname || request.Name || 'Unknown User')
                  : (request.Name || 'Unknown User');
                
                return (
                  <div 
                    key={`sent-${request.id || `temp-${index}`}`} 
                    className="card flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div 
                        className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleViewProfile(receiver?.id || request.receiverId)}
                      >
                        {receiver?.profile?.profilePicture ? (
                          <img
                            src={`http://localhost:3000${receiver.profile.profilePicture}`}
                            alt={receiver.firstname || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {(receiver?.firstname?.[0] || request.Name?.[0] || displayName?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold truncate cursor-pointer hover:text-teal-600 transition-colors"
                          onClick={() => handleViewProfile(receiver?.id || request.receiverId)}
                        >
                          {displayName}
                        </h3>
                        {receiver?.email && (
                          <p className="text-sm text-gray-600 truncate">{receiver.email}</p>
                        )}
                        {receiver?.role && (
                          <p className="text-sm text-gray-500 capitalize">{receiver.role.toLowerCase()}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveConnection(request.id);
                      }}
                      className="bg-teal-100 text-teal-800 hover:bg-teal-200 px-4 py-2 rounded-md font-medium transition-colors duration-200 ml-4 flex-shrink-0"
                    >
                      Cancel Request
                    </button>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No sent requests</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-400 mt-2">Debug: sentRequests length = {sentRequests?.length || 0}</p>
            )}
          </div>
        )}
      </div>

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
                    <h3 
                      className="font-semibold cursor-pointer hover:text-teal-600 transition-colors"
                      onClick={() => handleViewProfile(request.senderId || request.sender?.id)}
                    >
                      {request.Name || 'Unknown User'}
                    </h3>
                    <p className="text-gray-600">Wants to connect with you</p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptRequest(request.id);
                      }}
                      className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md font-medium transition-colors duration-200"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveConnection(request.id);
                      }}
                      className="bg-teal-100 text-teal-800 hover:bg-teal-200 px-4 py-2 rounded-md font-medium transition-colors duration-200"
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
                      <div 
                        className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleViewProfile(connection.id)}
                      >
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
                      <div className="flex-1">
                        <h3 
                          className="font-semibold cursor-pointer hover:text-teal-600 transition-colors"
                          onClick={() => handleViewProfile(connection.id)}
                        >
                          {connection.firstname || 'Unknown User'} {connection.lastname || ''}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
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