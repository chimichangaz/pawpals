// src/pages/Forum.js - Pet Owners Community Forum
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ForumService } from '../services/forum.service';

function Forum() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const categories = [
    { id: 'all', name: 'All Topics', icon: '💬' },
    { id: 'health', name: 'Health & Wellness', icon: '🏥' },
    { id: 'behavior', name: 'Behavior & Training', icon: '🎓' },
    { id: 'nutrition', name: 'Food & Nutrition', icon: '🍖' },
    { id: 'grooming', name: 'Grooming & Care', icon: '✂️' },
    { id: 'adoption', name: 'Adoption & Rescue', icon: '🏠' },
    { id: 'general', name: 'General Discussion', icon: '💭' },
    { id: 'emergency', name: 'Emergency Help', icon: '🚨' }
  ];

  useEffect(() => {
    loadPosts();
  }, [selectedCategory, sortBy]);

  async function loadPosts() {
    try {
      setLoading(true);
      const allPosts = await ForumService.getPosts(selectedCategory, sortBy);
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading forum posts:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPosts = posts.filter(post => {
    if (!searchTerm) return true;
    return (
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Pet Owners Community Forum</h1>
          <p>Ask questions, share experiences, and help fellow pet owners</p>
        </div>
        {currentUser && (
          <button 
            onClick={() => setShowNewPostForm(true)} 
            className="btn btn-primary"
          >
            Ask a Question
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="forum-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="forum-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="answered">Most Answered</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading forum posts...</div>
      ) : (
        <>
          <div className="results-count">
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
          </div>
          
          <div className="forum-posts">
            {filteredPosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>No posts found</h3>
                <p>Be the first to start a discussion in this category!</p>
                {currentUser && (
                  <button 
                    onClick={() => setShowNewPostForm(true)} 
                    className="btn btn-primary"
                  >
                    Create First Post
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map(post => (
                <ForumPostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </>
      )}

      {showNewPostForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <NewPostForm
              categories={categories.filter(cat => cat.id !== 'all')}
              onSuccess={() => {
                setShowNewPostForm(false);
                loadPosts();
              }}
              onCancel={() => setShowNewPostForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Forum Post Card Component
function ForumPostCard({ post }) {
  const [showReplies, setShowReplies] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const { currentUser } = useAuth();

  const getCategoryInfo = (categoryId) => {
    const categories = {
      'health': { name: 'Health & Wellness', icon: '🏥', color: '#e74c3c' },
      'behavior': { name: 'Behavior & Training', icon: '🎓', color: '#3498db' },
      'nutrition': { name: 'Food & Nutrition', icon: '🍖', color: '#27ae60' },
      'grooming': { name: 'Grooming & Care', icon: '✂️', color: '#9b59b6' },
      'adoption': { name: 'Adoption & Rescue', icon: '🏠', color: '#f39c12' },
      'general': { name: 'General Discussion', icon: '💭', color: '#34495e' },
      'emergency': { name: 'Emergency Help', icon: '🚨', color: '#e74c3c' }
    };
    return categories[categoryId] || categories['general'];
  };

  async function handleReplySubmit() {
    if (!newReply.trim() || !currentUser) return;

    try {
      setSubmittingReply(true);
      await ForumService.addReply(post.id, {
        content: newReply.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous'
      });
      setNewReply('');
      // Refresh post data here if needed
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  }

  const category = getCategoryInfo(post.category);
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <div className="forum-post-card">
      <div className="post-header">
        <div className="post-meta">
          <span 
            className="post-category"
            style={{ backgroundColor: category.color }}
          >
            {category.icon} {category.name}
          </span>
          <span className="post-author">by {post.authorName}</span>
          <span className="post-time">{timeAgo}</span>
        </div>
        {post.isUrgent && (
          <span className="urgent-badge">🚨 Urgent</span>
        )}
      </div>

      <div className="post-content">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-text">{post.content}</p>
        
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="post-actions">
        <button 
          onClick={() => setShowReplies(!showReplies)}
          className="btn btn-secondary small"
        >
          💬 {post.replyCount || 0} Replies
        </button>
        <button className="btn btn-secondary small">
          👍 {post.likes || 0} Helpful
        </button>
        {currentUser && (
          <button className="btn btn-secondary small">
            📌 Follow
          </button>
        )}
      </div>

      {showReplies && (
        <div className="replies-section">
          <div className="replies-list">
            {post.replies?.map(reply => (
              <div key={reply.id} className="reply-item">
                <div className="reply-header">
                  <span className="reply-author">{reply.authorName}</span>
                  <span className="reply-time">{getTimeAgo(reply.createdAt)}</span>
                </div>
                <p className="reply-content">{reply.content}</p>
              </div>
            ))}
          </div>

          {currentUser && (
            <div className="reply-form">
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Share your thoughts or advice..."
                rows="3"
              />
              <button 
                onClick={handleReplySubmit}
                disabled={!newReply.trim() || submittingReply}
                className="btn btn-primary small"
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// New Post Form Component
function NewPostForm({ categories, onSuccess, onCancel }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    isUrgent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please enter a title for your post');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Please enter your question or message');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isUrgent: formData.isUrgent,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous'
      };
      
      await ForumService.createPost(postData);
      onSuccess();
      
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="new-post-form">
      <div className="form-header">
        <h2>Ask a Question</h2>
        <button onClick={onCancel} className="close-btn">&times;</button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Question Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="What's your question about?"
            maxLength={200}
            required
          />
          <small>{formData.title.length}/200 characters</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isUrgent"
                checked={formData.isUrgent}
                onChange={handleChange}
              />
              This is urgent/time-sensitive
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="content">Your Question *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Provide details about your question. Include your pet's breed, age, and any relevant symptoms or behaviors..."
            rows="6"
            maxLength={2000}
            required
          />
          <small>{formData.content.length}/2000 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (optional)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="puppy, training, emergency (separate with commas)"
          />
          <small>Add relevant tags to help others find your post</small>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Posting...' : 'Post Question'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Utility function for time formatting
function getTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown time';
  
  const now = new Date();
  const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return time.toLocaleDateString();
}

export default Forum;