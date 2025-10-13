import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ForumService } from '../services/forum.service';

const CATEGORIES = [
  { id: 'all', name: 'All Topics', icon: '💬' },
  { id: 'health', name: 'Health & Wellness', icon: '🏥' },
  { id: 'behavior', name: 'Behavior & Training', icon: '🎓' },
  { id: 'nutrition', name: 'Food & Nutrition', icon: '🍖' },
  { id: 'grooming', name: 'Grooming & Care', icon: '✂️' },
  { id: 'adoption', name: 'Adoption & Rescue', icon: '🏠' },
  { id: 'general', name: 'General Discussion', icon: '💭' },
  { id: 'emergency', name: 'Emergency Help', icon: '🚨' }
];

export default function Forum() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy]);

  async function loadPosts() {
    try {
      setLoading(true);
      const allPosts = await ForumService.getPosts(selectedCategory, sortBy);
      setPosts(allPosts || []);
    } catch (error) {
      console.error('Error loading forum posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredPosts = posts.filter(post => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (post.title || '').toLowerCase().includes(q) ||
      (post.content || '').toLowerCase().includes(q) ||
      (post.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-4 justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-white text-2xl shadow-lg">🐾</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Pet Owners Community Forum</h1>
              <p className="mt-2 text-gray-600">Ask questions, share experiences, and help fellow pet owners.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: categories & filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Categories</h3>
                  <div className="text-xs text-gray-400">Filter</div>
                </div>
                <div className="grid gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${selectedCategory === cat.id ? 'bg-emerald-500/10 ring-1 ring-emerald-200 text-emerald-700' : 'hover:bg-gray-50'}`}>
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100 p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700">Search</label>
                <div className="mt-2 relative">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search posts or tags..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Sort</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2">
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="answered">Most Answered</option>
                    <option value="unanswered">Unanswered</option>
                  </select>
                </div>

                <div className="mt-4 flex justify-center">
                  {currentUser ? (
                    <button onClick={() => setShowNewPostForm(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-semibold shadow">Ask a Question</button>
                  ) : (
                    <div className="text-sm text-gray-500">Sign in to post questions.</div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Right: posts */}
          <section className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">{filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found</div>
              <div className="text-sm text-gray-500">Showing {selectedCategory === 'all' ? 'all' : CATEGORIES.find(c => c.id === selectedCategory)?.name}</div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="rounded-xl p-8 bg-white/80 border border-gray-100 shadow-sm text-center">Loading forum posts...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="rounded-xl p-8 bg-white/80 border border-gray-100 shadow-sm text-center">
                  <div className="text-4xl mb-2">💬</div>
                  <h3 className="text-lg font-semibold">No posts found</h3>
                  <p className="text-sm text-gray-500">Be the first to start a discussion in this category!</p>
                  {currentUser && (
                    <div className="mt-4">
                      <button onClick={() => setShowNewPostForm(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-semibold shadow">Create First Post</button>
                    </div>
                  )}
                </div>
              ) : (
                filteredPosts.map(post => <ForumPostCard key={post.id} post={post} refresh={loadPosts} />)
              )}
            </div>
          </section>
        </div>
      </div>

      {showNewPostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewPostForm(false)} />
          <div className="relative w-full max-w-2xl p-6">
            <div className="rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
              <NewPostForm categories={CATEGORIES.filter(c => c.id !== 'all')} onSuccess={() => { setShowNewPostForm(false); loadPosts(); }} onCancel={() => setShowNewPostForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ForumPostCard({ post, refresh }) {
  const [showReplies, setShowReplies] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const { currentUser } = useAuth();

  const category = getCategoryInfo(post.category);
  const timeAgo = getTimeAgo(post.createdAt);

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
      if (refresh) refresh();
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <article className="rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ background: category.color + '20' }}>
              <span>{category.icon}</span>
              <span className="text-sm text-gray-700">{category.name}</span>
            </span>
            <div className="text-xs text-gray-500">by <span className="font-medium text-gray-700">{post.authorName}</span> • {timeAgo}</div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-3">{post.content}</p>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map(t => (
                <span key={t} className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">#{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {post.isUrgent && <div className="text-rose-500 text-sm font-semibold">🚨 Urgent</div>}

          <div className="flex flex-col items-end gap-2">
            <button onClick={() => setShowReplies(s => !s)} className="px-3 py-1 rounded-md bg-white border text-sm">💬 {post.replyCount || 0}</button>
            <button className="px-3 py-1 rounded-md bg-white border text-sm">👍 {post.likes || 0}</button>
            <button className="px-3 py-1 rounded-md bg-white border text-sm">📌 Follow</button>
          </div>
        </div>
      </div>

      {showReplies && (
        <div className="mt-4 border-t pt-4">
          <div className="space-y-3">
            {post.replies?.map(reply => (
              <div key={reply.id} className="rounded-lg bg-white p-3 border">
                <div className="text-xs text-gray-500">{reply.authorName} • {getTimeAgo(reply.createdAt)}</div>
                <div className="mt-1 text-sm text-gray-700">{reply.content}</div>
              </div>
            ))}
          </div>

          {currentUser && (
            <div className="mt-4">
              <textarea value={newReply} onChange={(e) => setNewReply(e.target.value)} placeholder="Share your thoughts..." className="w-full rounded-md border p-3" rows={3} />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => setNewReply('')} className="px-4 py-2 rounded-md bg-white border">Cancel</button>
                <button onClick={handleReplySubmit} disabled={!newReply.trim() || submittingReply} className="px-4 py-2 rounded-md bg-gradient-to-r from-teal-600 to-cyan-500 text-white">{submittingReply ? 'Posting...' : 'Post Reply'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function getCategoryInfo(categoryId) {
  const categories = {
    health: { name: 'Health & Wellness', icon: '🏥', color: '#34D399' },
    behavior: { name: 'Behavior & Training', icon: '🎓', color: '#60A5FA' },
    nutrition: { name: 'Food & Nutrition', icon: '🍖', color: '#F59E0B' },
    grooming: { name: 'Grooming & Care', icon: '✂️', color: '#A78BFA' },
    adoption: { name: 'Adoption & Rescue', icon: '🏠', color: '#F97316' },
    general: { name: 'General Discussion', icon: '💭', color: '#64748B' },
    emergency: { name: 'Emergency Help', icon: '🚨', color: '#F87171' }
  };
  return categories[categoryId] || categories.general;
}

function NewPostForm({ categories, onSuccess, onCancel }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({ title: '', content: '', category: 'general', tags: '', isUrgent: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) return setError('Please enter a title');
    if (!formData.content.trim()) return setError('Please enter your question');
    try {
      setLoading(true);
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        isUrgent: formData.isUrgent,
      };
      await ForumService.createPost(postData);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error creating post', err);
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Ask a Question</h2>
        <button onClick={onCancel} className="text-gray-500 text-xl">&times;</button>
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Question Title *</label>
          <input name="title" value={formData.title} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2" maxLength={200} required />
          <div className="text-xs text-gray-400 mt-1">{formData.title.length}/200</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category *</label>
          <select name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2">
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Your Question *</label>
          <textarea name="content" value={formData.content} onChange={handleChange} rows={6} maxLength={2000} className="mt-1 w-full rounded-md border px-3 py-2" required />
          <div className="text-xs text-gray-400 mt-1">{formData.content.length}/2000</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
          <input name="tags" value={formData.tags} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="puppy, training, emergency" />
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="isUrgent" checked={formData.isUrgent} onChange={handleChange} />
            <span>Mark as urgent</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-white border">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-gradient-to-r from-teal-600 to-cyan-500 text-white">{loading ? 'Posting...' : 'Post Question'}</button>
        </div>
      </form>
    </div>
  );
}

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
