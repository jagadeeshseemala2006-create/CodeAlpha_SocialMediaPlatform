import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { UserCheck, UserPlus, Sparkles } from 'lucide-react';

export const SuggestedUsers: React.FC = () => {
  const { user: currentUser, token, toggleFollow } = useAuth();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSuggestions = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.users);
      }
    } catch (e) {
      console.error('Error fetching suggestions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [token, currentUser?.following]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col gap-4 animate-pulse">
        <div className="h-5 w-32 bg-gray-100 rounded"></div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-150"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-gray-150 rounded"></div>
                <div className="h-2 w-14 bg-gray-150 rounded"></div>
              </div>
              <div className="w-12 h-6 bg-gray-150 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 flex flex-col gap-4 vibrant-card-shadow">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-1.5 text-gray-800">
          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
          <h3 className="text-sm font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Suggested for you</h3>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {suggestions.map((s) => {
          const isFollowing = currentUser?.following.includes(s._id);

          return (
            <div key={s._id} className="flex items-center justify-between gap-3 text-xs">
              <Link 
                to={`/profile/${s._id}`} 
                className="flex items-center gap-3 min-w-0 hover:opacity-90 group cursor-pointer"
              >
                {s.profilePicture ? (
                  <img
                    src={s.profilePicture}
                    alt={s.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-150">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {s.name}
                  </p>
                  <p className="text-gray-400 truncate">
                    @{s.username}
                  </p>
                </div>
              </Link>

              <button
                onClick={() => toggleFollow(s._id, !isFollowing)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isFollowing
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    : 'gradient-btn-secondary text-white shadow-sm hover:scale-[1.03]'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
