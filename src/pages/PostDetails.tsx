import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Post, Comment } from '../types.js';
import { formatTimeAgo } from '../utils.js';
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  Send, 
  Trash2, 
  User as UserIcon,
  MessageCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

export const PostDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Likes & comments states
  const [likes, setLikes] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  const isLiked = currentUser ? likes.includes(currentUser._id) : false;

  const fetchPost = async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        setLikes(data.post.likes || []);
        setComments(data.post.comments || []);
      } else {
        showToast('Failed to load post details.', 'error');
        navigate('/');
      }
    } catch (e) {
      console.error('Error fetching post:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id, token]);

  const handleLikeToggle = async () => {
    if (!currentUser || !token || !post || isLiking) return;

    setIsLiking(true);
    const originalLikes = [...likes];
    const willLike = !isLiked;

    // Optimistic Update
    if (willLike) {
      setLikes((prev) => [...prev, currentUser._id]);
    } else {
      setLikes((prev) => prev.filter((uid) => uid !== currentUser._id));
    }

    try {
      const endpoint = willLike ? `/api/posts/like/${post._id}` : `/api/posts/unlike/${post._id}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        setLikes(originalLikes);
        showToast('Failed to like post.', 'error');
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
    if (!currentUser || !token || !commentText.trim() || !post || isSubmittingComment) return;

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
        showToast('Comment added!', 'success');
      } else {
        showToast(data.error || 'Failed to submit comment.', 'error');
      }
    } catch (err) {
      showToast('Connection error.', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token || !post) return;

    if (!window.confirm('Delete this comment permanently?')) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.post) {
        setComments(data.post.comments);
        showToast('Comment deleted successfully.', 'info');
      } else {
        showToast(data.error || 'Failed to delete comment.', 'error');
      }
    } catch (e) {
      showToast('Connection error.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse flex flex-col gap-6">
        <div className="h-5 w-24 bg-gray-150 rounded"></div>
        <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-150"></div>
            <div className="space-y-2">
              <div className="h-3 w-28 bg-gray-150 rounded"></div>
              <div className="h-2 w-14 bg-gray-150 rounded"></div>
            </div>
          </div>
          <div className="h-4 w-full bg-gray-150 rounded"></div>
          <div className="aspect-video w-full bg-gray-150 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h3 className="text-lg font-bold text-gray-900">Post not found</h3>
        <p className="text-sm text-gray-400 mt-1">This post may have been deleted by its author.</p>
        <Link to="/" className="text-sm text-blue-600 font-bold hover:underline mt-4 inline-block">Back to Feed</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 pb-24 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-150 transition-all text-gray-500 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Post Thread</h2>
          <p className="text-xs text-gray-400">View detailed conversation or engrave responses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Full Post Block */}
        <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 flex items-center justify-between">
            <Link to={`/profile/${post.user._id}`} className="flex items-center gap-3 hover:opacity-90 group cursor-pointer">
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
          </div>

          <div className="px-5 pb-4">
            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
              {post.caption}
            </p>
          </div>

          {post.image && (
            <div className="w-full bg-gray-50 border-y border-gray-100 max-h-[450px] overflow-hidden flex items-center justify-center">
              <img
                src={post.image}
                alt="Post media"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Post Stats */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-6">
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-2 group transition-colors cursor-pointer text-sm font-medium ${
                isLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${
                isLiked ? 'bg-rose-50' : 'group-hover:bg-rose-50'
              }`}>
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              </div>
              <span>{likes.length} Likes</span>
            </button>

            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <div className="p-1.5 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span>{comments.length} Comments</span>
            </div>
          </div>
        </div>

        {/* Thread Comments list */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Discussion</h3>
          
          {comments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-10 text-center flex flex-col items-center gap-2 shadow-sm">
              <MessageCircle className="w-8 h-8 text-gray-300" />
              <h4 className="text-xs font-bold text-gray-900 mt-1">No comments yet</h4>
              <p className="text-[11px] text-gray-400">Share your thoughts and spark a developer discussion!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map((c) => {
                const commentUser = c.user;
                const isOwnComment = currentUser?._id === commentUser._id;
                const isPostOwner = currentUser?._id === post.user._id;

                return (
                  <div key={c._id} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex items-start gap-3.5 group">
                    <Link to={`/profile/${commentUser._id}`} className="shrink-0 cursor-pointer">
                      {commentUser.profilePicture ? (
                        <img
                          src={commentUser.profilePicture}
                          alt={commentUser.name}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-150">
                          {commentUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/profile/${commentUser._id}`} className="text-xs font-bold text-gray-900 hover:text-blue-600 cursor-pointer">
                          {commentUser.name}
                        </Link>
                        <span className="text-[10px] text-gray-400">@{commentUser.username}</span>
                        <span className="text-[9px] text-gray-300">•</span>
                        <span className="text-[9px] text-gray-400">{formatTimeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1 leading-relaxed whitespace-pre-line">
                        {c.comment}
                      </p>
                    </div>

                    {/* Delete comment action */}
                    {(isOwnComment || isPostOwner) && (
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shrink-0 self-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comment Input Composer (at bottom) */}
        {currentUser && (
          <form onSubmit={handleAddComment} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex items-center gap-3">
            {currentUser.profilePicture ? (
              <img
                src={currentUser.profilePicture}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-200 shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder="Share your perspective..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl pl-4 pr-10 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="absolute right-2 p-1.5 rounded-full text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-45 disabled:hover:bg-transparent cursor-pointer"
              >
                {isSubmittingComment ? (
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
