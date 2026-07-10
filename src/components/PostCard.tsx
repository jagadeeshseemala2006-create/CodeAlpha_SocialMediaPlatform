import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Post, Comment } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { formatTimeAgo } from '../utils.js';
import { useToast } from '../context/ToastContext.js';
import { 
  Heart, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Send, 
  Check, 
  X,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PostCardProps {
  post: Post;
  onPostDelete?: (postId: string) => void;
  onPostUpdate?: (updatedPost: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDelete, onPostUpdate }) => {
  const { user: currentUser, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [likes, setLikes] = useState<string[]>(post.likes);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  // Edit states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editCaption, setEditCaption] = useState<string>(post.caption);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const [showOptions, setShowOptions] = useState<boolean>(false);

  const isLiked = currentUser ? likes.includes(currentUser._id) : false;
  const isOwnPost = currentUser ? (post.user._id === currentUser._id) : false;

  const handleLikeToggle = async () => {
    if (!currentUser || !token || isLiking) return;

    setIsLiking(true);
    const originalLikes = [...likes];
    const willLike = !isLiked;

    // Optimistic Update
    if (willLike) {
      setLikes((prev) => [...prev, currentUser._id]);
    } else {
      setLikes((prev) => prev.filter((id) => id !== currentUser._id));
    }

    try {
      const endpoint = willLike ? `/api/posts/like/${post._id}` : `/api/posts/unlike/${post._id}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        // Revert on failure
        setLikes(originalLikes);
        showToast('Failed to update like.', 'error');
      }
    } catch (e) {
      setLikes(originalLikes);
      showToast('Connection error.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !token || !commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/comments/${post._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: commentText.trim() })
      });

      const data = await res.json();
      if (res.ok && data.post) {
        setComments(data.post.comments);
        setCommentText('');
        showToast('Comment posted successfully!', 'success');
        if (onPostUpdate) {
          onPostUpdate(data.post);
        }
      } else {
        showToast(data.error || 'Failed to add comment.', 'error');
      }
    } catch (err) {
      showToast('Connection error.', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!token || !isOwnPost) return;

    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showToast('Post deleted successfully.', 'info');
        if (onPostDelete) {
          onPostDelete(post._id);
        }
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete post.', 'error');
      }
    } catch (e) {
      showToast('Connection error.', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!token || !editCaption.trim() || isSavingEdit) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ caption: editCaption.trim() })
      });

      const data = await res.json();
      if (res.ok && data.post) {
        setIsEditing(false);
        showToast('Post updated!', 'success');
        if (onPostUpdate) {
          onPostUpdate(data.post);
        }
      } else {
        showToast(data.error || 'Failed to edit post.', 'error');
      }
    } catch (e) {
      showToast('Connection error.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <article className="bg-white rounded-[16px] border border-[#E2E8F0] vibrant-card-shadow vibrant-card-hover overflow-hidden flex flex-col">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <Link 
          to={`/profile/${post.user._id}`} 
          className="flex items-center gap-3 hover:opacity-90 group cursor-pointer"
        >
          {post.user.profilePicture ? (
            <img
              src={post.user.profilePicture}
              alt={post.user.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
              {post.user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
              {post.user.name}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>@{post.user.username}</span>
              <span>•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>
        </Link>

        {/* Options / Dropdown for deletion/editing */}
        <div className="relative">
          {isOwnPost && (
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          )}

          {showOptions && isOwnPost && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-150 rounded-xl shadow-lg py-1.5 w-36 z-10">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowOptions(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 w-full text-left cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Caption
              </button>
              <button
                onClick={() => {
                  handleDeletePost();
                  setShowOptions(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 w-full text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Caption or Edit Caption Input */}
      <div className="px-5 pb-3">
        {isEditing ? (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditCaption(post.caption);
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editCaption.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSavingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
            {post.caption}
          </p>
        )}
      </div>

      {/* 3. Post Image */}
      {post.image && (
        <div 
          onClick={() => navigate(`/posts/${post._id}`)}
          className="aspect-video w-full bg-gray-50 border-y border-gray-100 overflow-hidden cursor-pointer group"
        >
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      )}

      {/* 4. Footer Actions (Like, Comment counts) */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-6">
        {/* Like */}
        <button
          onClick={handleLikeToggle}
          className={`flex items-center gap-2 group transition-colors cursor-pointer text-sm font-medium ${
            isLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'
          }`}
        >
          <motion.div
            whileTap={{ scale: 1.4 }}
            className={`p-1.5 rounded-lg transition-colors ${
              isLiked ? 'bg-rose-50' : 'group-hover:bg-rose-50'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </motion.div>
          <span>{likes.length}</span>
        </button>

        {/* Comments count / Collapse trigger */}
        <button
          onClick={() => {
            setShowCommentInput(!showCommentInput);
            // Alternatively navigate if image clicked or double-action
          }}
          className={`flex items-center gap-2 group transition-colors cursor-pointer text-sm font-medium ${
            showCommentInput ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
          }`}
        >
          <div className={`p-1.5 rounded-lg transition-colors ${
            showCommentInput ? 'bg-blue-50' : 'group-hover:bg-blue-50'
          }`}>
            <MessageSquare className="w-5 h-5" />
          </div>
          <span>{comments.length}</span>
        </button>

        {/* View Details full comments */}
        <Link 
          to={`/posts/${post._id}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline ml-auto cursor-pointer"
        >
          View Details
        </Link>
      </div>

      {/* 5. Collapsible Comments Composer */}
      <AnimatePresence>
        {showCommentInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
          >
            {/* Short comments summary preview */}
            {comments.length > 0 && (
              <div className="px-5 pt-3 flex flex-col gap-2 max-h-32 overflow-y-auto border-b border-gray-100/50">
                {comments.slice(-2).map((c) => (
                  <div key={c._id} className="text-xs flex items-start gap-1.5">
                    <span className="font-semibold text-gray-800">@{c.user.username}:</span>
                    <span className="text-gray-600 truncate flex-1">{c.comment}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-3 px-5 py-3.5">
              {currentUser?.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200">
                  {currentUser?.name.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-full pl-4 pr-10 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="absolute right-2 p-1.5 rounded-full text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </article>
  );
};
