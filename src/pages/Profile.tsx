import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { User, Post } from '../types.js';
import { 
  Edit3, 
  UserPlus, 
  UserMinus, 
  Grid, 
  MapPin, 
  Calendar, 
  Sparkles,
  Heart,
  MessageCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'motion/react';

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, token, toggleFollow } = useAuth();
  const { showToast } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const isOwnProfile = currentUser?._id === id;
  const isFollowing = currentUser?.following.includes(id || '');

  const fetchProfile = async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileUser(data.user);
        setProfilePosts(data.posts || []);
      } else {
        showToast('Failed to fetch user profile.', 'error');
        navigate('/');
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, token, currentUser?.following]);

  const handleFollowToggle = async () => {
    if (!id || isLiking) return;
    setIsLiking(true);
    const success = await toggleFollow(id, !isFollowing);
    setIsLiking(false);
    if (success) {
      // Manually adjust the followers array locally so stats increment instantly
      setProfileUser((prev) => {
        if (!prev) return null;
        const followers = isFollowing
          ? prev.followers.filter((fId) => fId !== currentUser?._id)
          : [...prev.followers, currentUser?._id || ''];
        return { ...prev, followers };
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse flex flex-col gap-6">
        <div className="h-48 bg-gray-150 rounded-2xl"></div>
        <div className="flex gap-4 -mt-16 px-6 items-end">
          <div className="w-28 h-28 rounded-full bg-gray-250 border-4 border-white"></div>
          <div className="flex-1 space-y-2 mb-2">
            <div className="h-4 w-36 bg-gray-150 rounded"></div>
            <div className="h-3 w-20 bg-gray-150 rounded"></div>
          </div>
        </div>
        <div className="space-y-2 px-6">
          <div className="h-3 w-5/6 bg-gray-150 rounded"></div>
          <div className="h-3 w-4/6 bg-gray-150 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-3">
        <h3 className="text-lg font-bold text-gray-900">User not found</h3>
        <p className="text-sm text-gray-400">The profile you are looking for does not exist or has been deleted.</p>
        <Link to="/" className="text-sm font-bold text-blue-600 hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-24 flex flex-col gap-6">
      
      {/* 1. PROFILE CARD MODULE */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden vibrant-card-shadow">
        
        {/* Cover Banner */}
        <div className="h-40 sm:h-52 bg-gradient-to-r from-blue-100 to-indigo-100 relative">
          {profileUser.coverBanner ? (
            <img
              src={profileUser.coverBanner}
              alt="Cover banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-50/50">
              <Sparkles className="w-8 h-8 text-blue-300" />
            </div>
          )}
        </div>

        {/* Profile Avatar & Actions Block */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {profileUser.profilePicture ? (
              <img
                src={profileUser.profilePicture}
                alt={profileUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md bg-white shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-4xl border-4 border-white shadow-md bg-white shrink-0">
                {profileUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                {profileUser.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">@{profileUser.username}</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-2 self-start sm:self-end mb-2 shrink-0">
            {isOwnProfile ? (
              <Link
                to="/edit-profile"
                className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={handleFollowToggle}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isFollowing
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'gradient-btn text-white hover:scale-[1.02]'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <Link
                  to={`/messages?user=${profileUser._id}`}
                  className="flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Message
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Detailed Stats & Bio */}
        <div className="px-6 pb-6 border-t border-gray-100 pt-5 flex flex-col gap-4">
          {/* Bio text */}
          {profileUser.bio ? (
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed max-w-2xl">
              {profileUser.bio}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">No bio written yet.</p>
          )}

          {/* Metadata indicators */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-300" />
              <span>Joined {new Date(profileUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-300" />
              <span>Developer Workspace</span>
            </div>
          </div>

          {/* Stat counters */}
          <div className="flex gap-6 border-t border-gray-100/50 pt-4 text-sm mt-1">
            <div className="flex gap-1.5 items-baseline">
              <span className="font-bold text-gray-900">{profilePosts.length}</span>
              <span className="text-xs text-gray-400 font-medium">posts</span>
            </div>
            <div className="flex gap-1.5 items-baseline">
              <span className="font-bold text-gray-900">{profileUser.followers.length}</span>
              <span className="text-xs text-gray-400 font-medium">followers</span>
            </div>
            <div className="flex gap-1.5 items-baseline">
              <span className="font-bold text-gray-900">{profileUser.following.length}</span>
              <span className="text-xs text-gray-400 font-medium">following</span>
            </div>
          </div>

        </div>

      </div>

      {/* 2. USER POSTS GRID */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-gray-800 border-b border-gray-200 pb-3 mt-4">
          <Grid className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold tracking-tight">Posts Grid</h3>
        </div>

        {profilePosts.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center flex flex-col items-center gap-2 vibrant-card-shadow">
            <Clock className="w-8 h-8 text-gray-300" />
            <h4 className="text-sm font-bold text-gray-900 mt-2">No Posts Shared</h4>
            <p className="text-xs text-gray-400">Posts shared by @{profileUser.username} will show up here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {profilePosts.map((post) => (
              <div 
                key={post._id} 
                onClick={() => navigate(`/posts/${post._id}`)}
                className="aspect-square rounded-xl border border-[#E2E8F0] overflow-hidden relative group cursor-pointer bg-gray-50 vibrant-card-shadow vibrant-card-hover"
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt="Post grid layout"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-blue-50/20 to-indigo-50/20 group-hover:bg-blue-50/30 transition-colors">
                    <p className="text-xs text-gray-700 line-clamp-4 font-medium leading-relaxed">{post.caption}</p>
                    <span className="text-[9px] text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Overlaid engagement on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 fill-white" />
                    <span>{post.likes.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>{post.comments.length}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
