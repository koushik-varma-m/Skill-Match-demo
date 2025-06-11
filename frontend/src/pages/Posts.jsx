import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPost, setNewPost] = useState({ content: '', image: null });
  const [newComment, setNewComment] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/post', {
        withCredentials: true
      });
      setPosts(response.data.posts);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Posts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, image: file });
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      if (newPost.image) {
        formData.append('image', newPost.image);
      }

      await axios.post('http://localhost:3000/api/post/create', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setNewPost({ content: '', image: null });
      setImagePreview(null);
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.response?.data?.message || 'Failed to create post');
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`http://localhost:3000/api/post/${postId}/like`, {}, {
        withCredentials: true
      });
      fetchPosts();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (postId) => {
    try {
      await axios.post(`http://localhost:3000/api/post/${postId}/comment`, {
        comment: newComment[postId]
      }, {
        withCredentials: true
      });
      setNewComment({ ...newComment, [postId]: '' });
      fetchPosts();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:3000/api/post/${postId}`, {
        withCredentials: true
      });
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await axios.delete(`http://localhost:3000/api/post/${postId}/comment/${commentId}`, {
        withCredentials: true
      });
      fetchPosts();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <form onSubmit={handleCreatePost} className="card">
          <h2 className="text-xl font-bold mb-4">Create Post</h2>
          <textarea
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            placeholder="What's on your mind?"
            className="input-field h-32 resize-none"
            required
          />
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setNewPost({ ...newPost, image: null });
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary mt-4">
            Post
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:opacity-80"
                onClick={() => handleViewProfile(post.user.id)}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  {post.user.profile?.profilePicture ? (
                    <img
                      src={`http://localhost:3000${post.user.profile.profilePicture}`}
                      alt={post.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {post.user.firstname[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {post.user.firstname} {post.user.lastname}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {post.user.id === user?.id && (
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              )}
            </div>

            <p className="text-gray-800 mb-4">{post.content}</p>
            
            {post.image && (
              <img
                src={`http://localhost:3000${post.image}`}
                alt="Post"
                className="rounded-lg max-h-96 w-full object-cover mb-4"
              />
            )}

            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center space-x-1 text-gray-600"
              >
                <span>{post.like?.some(like => like.id === user?.id) ? '❤️' : '🤍'}</span>
                <span>{post.like?.length || 0} likes</span>
              </button>
            </div>

            {/* Comments Section */}
            <div className="border-t pt-4">
              <div className="space-y-4 mb-4">
                {post.comments?.map(comment => (
                  <div key={comment.id} className="flex space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80"
                      onClick={() => handleViewProfile(comment.user.id)}
                    >
                      {comment.user.profile?.profilePicture ? (
                        <img
                          src={`http://localhost:3000${comment.user.profile.profilePicture}`}
                          alt={comment.user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          {comment.user.firstname[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <p 
                            className="font-medium text-sm cursor-pointer hover:opacity-80"
                            onClick={() => handleViewProfile(comment.user.id)}
                          >
                            {comment.user.firstname} {comment.user.lastname}
                          </p>
                          {comment.user.id === user?.id && (
                            <button
                              onClick={() => handleDeleteComment(post.id, comment.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-gray-800">{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment[post.id] || ''}
                  onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                  placeholder="Write a comment..."
                  className="input-field flex-1"
                />
                <button
                  onClick={() => handleComment(post.id)}
                  className="btn-primary"
                  disabled={!newComment[post.id]}
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Posts; 