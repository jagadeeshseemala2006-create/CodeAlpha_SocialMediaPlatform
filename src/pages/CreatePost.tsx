import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { fileToBase64 } from '../utils.js';
import { ArrowLeft, Image as ImageIcon, Send, X, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const CreatePost: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [caption, setCaption] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        showToast('Image is too large. Max 8MB allowed.', 'error');
        return;
      }

      setImageFile(file);
      try {
        const base64 = await fileToBase64(file);
        setImagePreview(base64);
      } catch (err) {
        showToast('Failed to parse file.', 'error');
      }
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || !token || submitting) return;

    setSubmitting(true);
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
        showToast('Post published successfully!', 'success');
        navigate('/'); // redirect to feed
      } else {
        showToast(data.error || 'Failed to publish post.', 'error');
      }
    } catch (err) {
      showToast('Connection error, try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 pb-24 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-150 transition-all text-gray-500 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create Post</h2>
          <p className="text-xs text-gray-400">Share your project updates, accomplishments, or coding questions.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden p-6 flex flex-col gap-6">
        
        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-3">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">@{user.username}</p>
              <p className="text-[10px] text-gray-400">Publishing to public feed</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePublish} className="flex flex-col gap-5">
          {/* Caption Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Caption / Description</label>
            <textarea
              required
              rows={5}
              placeholder="Write something interesting... support tags like #javascript #tailwindcss #coding"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Image Upload Zone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Post Image (Optional)</label>
            
            {imagePreview ? (
              <div className="relative rounded-xl border border-gray-150 overflow-hidden bg-gray-50 aspect-video w-full max-h-80">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50/50 hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-800">Click to upload image</p>
                  <p className="text-[10px] text-gray-400 mt-1">Supports PNG, JPG, or GIF up to 8MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 mt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !caption.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing Post...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
