// src/services/forum.service.js - Forum backend service
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';

export class ForumService {
  // Create a new forum post
  static async createPost(postData) {
    try {
      console.log('ForumService: Creating post with data:', postData);
      
      // Validate required fields
      if (!postData.authorId) {
        throw new Error('Author ID is required');
      }
      if (!postData.title || !postData.title.trim()) {
        throw new Error('Post title is required');
      }
      if (!postData.content || !postData.content.trim()) {
        throw new Error('Post content is required');
      }

      const postToSave = {
        ...postData,
        title: postData.title.trim(),
        content: postData.content.trim(),
        category: postData.category || 'general',
        tags: postData.tags || [],
        isUrgent: postData.isUrgent || false,
        likes: 0,
        replyCount: 0,
        views: 0,
        isResolved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'forum_posts'), postToSave);
      console.log('ForumService: Post created successfully with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('ForumService: Error creating post:', error);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  // Get forum posts with filters
  static async getPosts(category = 'all', sortBy = 'recent', limitCount = 50) {
    try {
      console.log('ForumService: Fetching posts with filters:', { category, sortBy, limitCount });
      
      let q = collection(db, 'forum_posts');
      
      // Apply category filter
      if (category && category !== 'all') {
        q = query(q, where('category', '==', category));
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'popular':
          q = query(q, orderBy('likes', 'desc'), limit(limitCount));
          break;
        case 'answered':
          q = query(q, orderBy('replyCount', 'desc'), limit(limitCount));
          break;
        case 'unanswered':
          q = query(q, where('replyCount', '==', 0), orderBy('createdAt', 'desc'), limit(limitCount));
          break;
        default: // recent
          q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const postData = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        };
        
        // Get replies for each post
        const replies = await this.getRepliesForPost(docSnapshot.id);
        postData.replies = replies.slice(0, 3); // Show first 3 replies
        postData.replyCount = replies.length;
        
        posts.push(postData);
      }

      console.log('ForumService: Found', posts.length, 'posts');
      return posts;
    } catch (error) {
      console.error('ForumService: Error fetching posts:', error);
      
      // Fallback without orderBy if index missing
      if (error.code === 'failed-precondition') {
        console.log('ForumService: Retrying without orderBy due to missing index...');
        try {
          let q = collection(db, 'forum_posts');
          if (category && category !== 'all') {
            q = query(q, where('category', '==', category));
          }
          
          const querySnapshot = await getDocs(q);
          const posts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort manually
          posts.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          
          return posts.slice(0, limitCount);
        } catch (retryError) {
          console.error('ForumService: Retry also failed:', retryError);
          throw new Error(`Failed to fetch posts: ${retryError.message}`);
        }
      }
      
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }
  }

  // Get replies for a specific post
  static async getRepliesForPost(postId) {
    try {
      const q = query(
        collection(db, 'forum_replies'), 
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const replies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return replies;
    } catch (error) {
      console.error('ForumService: Error fetching replies:', error);
      
      // Fallback without orderBy
      try {
        const q = query(
          collection(db, 'forum_replies'), 
          where('postId', '==', postId)
        );
        const querySnapshot = await getDocs(q);
        const replies = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort manually
        replies.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return aTime - bTime;
        });
        
        return replies;
      } catch (retryError) {
        console.error('ForumService: Reply fetch retry failed:', retryError);
        return [];
      }
    }
  }

  // Add a reply to a post
  static async addReply(postId, replyData) {
    try {
      console.log('ForumService: Adding reply to post:', postId, replyData);
      
      if (!postId) {
        throw new Error('Post ID is required');
      }
      if (!replyData.content || !replyData.content.trim()) {
        throw new Error('Reply content is required');
      }
      if (!replyData.authorId) {
        throw new Error('Author ID is required');
      }

      const replyToSave = {
        postId: postId,
        content: replyData.content.trim(),
        authorId: replyData.authorId,
        authorName: replyData.authorName || 'Anonymous',
        likes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add the reply
      const docRef = await addDoc(collection(db, 'forum_replies'), replyToSave);
      
      // Update the post's reply count
      const postRef = doc(db, 'forum_posts', postId);
      await updateDoc(postRef, {
        replyCount: increment(1),
        updatedAt: serverTimestamp()
      });

      console.log('ForumService: Reply added successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('ForumService: Error adding reply:', error);
      throw new Error(`Failed to add reply: ${error.message}`);
    }
  }

  // Update post (mark as resolved, etc.)
  static async updatePost(postId, updates) {
    try {
      console.log('ForumService: Updating post', postId, 'with updates:', updates);
      
      if (!postId) {
        throw new Error('Post ID is required');
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      const postRef = doc(db, 'forum_posts', postId);
      await updateDoc(postRef, updateData);
      
      console.log('ForumService: Post updated successfully:', postId);
    } catch (error) {
      console.error('ForumService: Error updating post:', error);
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  // Like/unlike a post
  static async togglePostLike(postId, userId) {
    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];
      
      if (likedBy.includes(userId)) {
        // Unlike
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: likedBy.filter(id => id !== userId),
          updatedAt: serverTimestamp()
        });
        return false; // not liked anymore
      } else {
        // Like
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        return true; // now liked
      }
    } catch (error) {
      console.error('ForumService: Error toggling like:', error);
      throw new Error(`Failed to toggle like: ${error.message}`);
    }
  }

  // Delete post (only by author or admin)
  static async deletePost(postId, userId) {
    try {
      console.log('ForumService: Deleting post:', postId, 'by user:', userId);
      
      // Check if user is the author
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      if (postData.authorId !== userId) {
        throw new Error('You can only delete your own posts');
      }

      // Delete all replies first
      const repliesQuery = query(
        collection(db, 'forum_replies'), 
        where('postId', '==', postId)
      );
      const repliesSnapshot = await getDocs(repliesQuery);
      
      const deletePromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete the post
      await deleteDoc(postRef);
      
      console.log('ForumService: Post and replies deleted successfully:', postId);
    } catch (error) {
      console.error('ForumService: Error deleting post:', error);
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  // Get posts by user
  static async getPostsByUser(userId) {
    try {
      console.log('ForumService: Fetching posts for user:', userId);
      
      const q = query(
        collection(db, 'forum_posts'), 
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('ForumService: Found', posts.length, 'posts for user:', userId);
      return posts;
    } catch (error) {
      console.error('ForumService: Error fetching user posts:', error);
      
      // Fallback without orderBy
      try {
        const q = query(
          collection(db, 'forum_posts'), 
          where('authorId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        posts.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        return posts;
      } catch (retryError) {
        console.error('ForumService: User posts retry failed:', retryError);
        return [];
      }
    }
  }

  // Search posts
  static async searchPosts(searchTerm, category = 'all') {
    try {
      console.log('ForumService: Searching posts for term:', searchTerm);
      
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia or similar
      
      let q = collection(db, 'forum_posts');
      if (category && category !== 'all') {
        q = query(q, where('category', '==', category));
      }
      
      const querySnapshot = await getDocs(q);
      const allPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter posts by search term (client-side filtering)
      const filteredPosts = allPosts.filter(post => {
        const searchLower = searchTerm.toLowerCase();
        return (
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
      
      // Sort by relevance (basic scoring)
      filteredPosts.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(a, searchTerm);
        const bScore = this.calculateRelevanceScore(b, searchTerm);
        return bScore - aScore;
      });
      
      console.log('ForumService: Found', filteredPosts.length, 'matching posts');
      return filteredPosts;
    } catch (error) {
      console.error('ForumService: Error searching posts:', error);
      throw new Error(`Failed to search posts: ${error.message}`);
    }
  }

  // Simple relevance scoring for search results
  static calculateRelevanceScore(post, searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    let score = 0;
    
    // Title matches are worth more
    if (post.title.toLowerCase().includes(searchLower)) {
      score += 10;
    }
    
    // Content matches
    if (post.content.toLowerCase().includes(searchLower)) {
      score += 5;
    }
    
    // Tag matches
    if (post.tags?.some(tag => tag.toLowerCase().includes(searchLower))) {
      score += 7;
    }
    
    // Recent posts get slight boost
    const daysSincePost = (Date.now() - (post.createdAt?.toMillis?.() || 0)) / (1000 * 60 * 60 * 24);
    if (daysSincePost < 7) {
      score += 2;
    }
    
    return score;
  }
}