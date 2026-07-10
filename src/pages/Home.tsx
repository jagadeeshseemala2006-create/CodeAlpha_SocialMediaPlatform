import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Post } from '../types.js';
import { PostCard } from '../components/PostCard.js';
import { SuggestedUsers } from '../components/SuggestedUsers.js';
import { fileToBase64 } from '../utils.js';
import { 
  Image, 
  Sparkles, 
  Plus, 
  Loader2, 
  Heart, 
  MessageCircle, 
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Home: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Composer State
  const [caption, setCaption] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchFeed = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      } else {
        showToast('Failed to retrieve feed.', 'error');
      }
    } catch (e) {
      console.error('Error fetching feed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [token]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        showToast('File is too large. Max 8MB allowed.', 'error');
        return;
      }

      setImageFile(file);
      try {
        const base64 = await fileToBase64(file);
        setImagePreview(base64);
      } catch (err) {
        showToast('Failed to process image file.', 'error');
      }
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || !token || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          caption: caption.trim(),
          image: imagePreview
        })
      });

      const data = await res.json();
      if (res.ok && data.post) {
        // Hydrate the post slightly or prepend
        const freshPost = {
          ...data.post,
          user: {
            _id: user?._id || '',
            name: user?.name || '',
            username: user?.username || '',
            profilePicture: user?.profilePicture || ''
          }
        };

        setPosts((prev) => [freshPost, ...prev]);
        setCaption('');
        setImageFile(null);
        setImagePreview('');
        showToast('Published post successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to publish post.', 'error');
      }
    } catch (err) {
      showToast('Connection error, try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      
      {/* LEFT COLUMN: Feed & Quick Compose */}
      <section className="lg:col-span-2 flex flex-col gap-6 h-full pb-20">
        
        {/* Stories Section with story-ring */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 vibrant-card-shadow flex gap-4 overflow-x-auto no-scrollbar">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="story-ring flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
              {user?.profilePicture ? (
                <img src={user.profilePicture} className="w-14 h-14 rounded-full border-[3px] border-white object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full border-[3px] border-white bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[64px]">Your Story</span>
          </div>

          {[
            { name: 'alex_dev', img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80' },
            { name: 'react_ninja', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80' },
            { name: 'css_wizard', img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80' },
            { name: 'mongo_guru', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80' },
            { name: 'node_master', img: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=120&q=80' },
            { name: 'git_lord', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
          ].map((story, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer">
              <div className="story-ring flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <img src={story.img} className="w-14 h-14 rounded-full border-[3px] border-white object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-900 transition-colors truncate max-w-[64px]">@{story.name}</span>
            </div>
          ))}
        </div>

        {/* Inline Composer Card */}
        {user && (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 vibrant-card-shadow flex flex-col gap-4">
            <div className="flex gap-4 items-start">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 border border-blue-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              <form onSubmit={handleCreatePost} className="flex-1 flex flex-col gap-3">
                <textarea
                  placeholder="What's cooking, dev? Share your code win or project update!"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full text-sm placeholder-gray-400 text-gray-800 border-0 focus:ring-0 focus:outline-none resize-none min-h-[70px]"
                />

                {/* Optional Image Preview inside composer */}
                <AnimatePresence>
                  {imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative rounded-xl border border-gray-150 overflow-hidden bg-gray-50 aspect-video w-full max-h-72"
                    >
                      <img
                        src={imagePreview}
                        alt="Preview upload"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Composer controls */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 mt-1">
                  <div className="flex items-center gap-1">
                    <label className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold">
                      <Image className="w-4.5 h-4.5 text-blue-500" />
                      <span className="hidden sm:inline">Add Media</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !caption.trim()}
                    className="flex items-center gap-2 gradient-btn disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Home Feed List */}
        <div className="flex flex-col gap-5">
          {loading ? (
            // Loading Skeletons
            [1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-150"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-28 bg-gray-150 rounded"></div>
                    <div className="h-2 w-16 bg-gray-150 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-150 rounded"></div>
                  <div className="h-3 w-5/6 bg-gray-150 rounded"></div>
                </div>
                <div className="aspect-video w-full bg-gray-150 rounded-xl"></div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mt-2">No Posts Yet</h3>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Be the first one to kickstart the community feed! Share a post using the composer above or follow suggested users.
              </p>
            </div>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p._id}
                post={p}
                onPostDelete={handlePostDelete}
                onPostUpdate={handlePostUpdate}
              />
            ))
          )}
        </div>

      </section>

      {/* RIGHT COLUMN: Sticky Suggestions (Only desktop) */}
      <aside className="hidden lg:block space-y-6">
        <div className="sticky top-8">
          <SuggestedUsers />
          <div className="mt-4 px-4 text-[10px] text-gray-400 font-medium flex flex-wrap gap-2">
            <span>About</span>
            <span>•</span>
            <span>Help</span>
            <span>•</span>
            <span>Terms</span>
            <span>•</span>
            <span>Privacy</span>
          </div>
        </div>
      </aside>

    </div>
  );
};
