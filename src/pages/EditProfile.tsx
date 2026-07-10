import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { fileToBase64 } from '../utils.js';
import { 
  Camera, 
  User as UserIcon, 
  ArrowLeft, 
  FileText, 
  Key, 
  Loader2, 
  Check, 
  Image as ImageIcon 
} from 'lucide-react';
import { motion } from 'motion/react';

export const EditProfile: React.FC = () => {
  const { user, updateProfile, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  // Fields state
  const [name, setName] = useState<string>(user.name);
  const [username, setUsername] = useState<string>(user.username);
  const [bio, setBio] = useState<string>(user.bio || '');
  const [password, setPassword] = useState<string>('');
  
  // Base64 Images state
  const [pfpPreview, setPfpPreview] = useState<string>(user.profilePicture || '');
  const [bannerPreview, setBannerPreview] = useState<string>(user.coverBanner || '');

  const [submitting, setSubmitting] = useState<boolean>(false);

  const handlePfpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image is too large. Max size 5MB.', 'error');
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setPfpPreview(base64);
      } catch (err) {
        showToast('Failed to load profile photo.', 'error');
      }
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        showToast('Image is too large. Max size 8MB.', 'error');
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setBannerPreview(base64);
      } catch (err) {
        showToast('Failed to load banner photo.', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      showToast('Name and Username are required fields.', 'error');
      return;
    }

    if (username.length < 3) {
      showToast('Username must be at least 3 characters.', 'error');
      return;
    }

    if (/\s/.test(username)) {
      showToast('Username cannot contain spaces.', 'error');
      return;
    }

    setSubmitting(true);
    const success = await updateProfile({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
      profilePicture: pfpPreview,
      coverBanner: bannerPreview,
      ...(password ? { password } : {})
    });
    setSubmitting(false);

    if (success) {
      navigate(`/profile/${user._id}`);
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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Edit Profile</h2>
          <p className="text-xs text-gray-400">Modify your public brand, bio details, and security.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* 1. COVER BANNER PREVIEW & CHANGER */}
        <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm relative group">
          <div className="h-36 sm:h-44 bg-gray-100 relative">
            {bannerPreview ? (
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="flex items-center gap-2 bg-white/95 text-gray-800 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-md hover:scale-105 transition-transform">
                <Camera className="w-4 h-4" />
                Change Cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 2. PROFILE PHOTO PREVIEW & CHANGER */}
          <div className="px-6 pb-4 flex items-end gap-4 -mt-10 sm:-mt-12 relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white shadow-md relative overflow-hidden group/pfp shrink-0">
              {pfpPreview ? (
                <img
                  src={pfpPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pfp:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <label className="p-2 bg-white/90 rounded-full text-gray-800 cursor-pointer shadow-sm hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePfpChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-xs text-gray-400 font-semibold">Profile Photo</p>
              <p className="text-[10px] text-gray-400">JPG, PNG or GIF. Max 5MB</p>
            </div>
          </div>
        </div>

        {/* 3. METADATA INPUTS */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Display Name</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Username</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 font-bold text-xs">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Bio Description</label>
            <div className="relative flex items-start">
              <span className="absolute left-3 top-3.5 text-gray-400">
                <FileText className="w-4 h-4" />
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a catchy bio for your developer brand..."
                rows={4}
                className="w-full text-xs border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 4. OPTIONAL SECURITY ACCESS */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-500" />
            Security & Password Change
          </h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">New Password (leave blank to keep current)</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md shadow-blue-100 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
