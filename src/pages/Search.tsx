import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { User } from '../types.js';
import { Search as SearchIcon, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const Search: React.FC = () => {
  const { token, user: currentUser, toggleFollow } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Search when query changes
  useEffect(() => {
    if (!token) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.users || []);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query, token]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 pb-24 flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Search Users</h2>
        <p className="text-xs text-gray-400">Discover other developers, engineers, and designers in the community.</p>
      </div>

      {/* Search Input bar */}
      <div className="relative flex items-center">
        <span className="absolute left-4 text-gray-400">
          <SearchIcon className="w-5 h-5" />
        </span>
        <input
          type="text"
          placeholder="Search by name or username (e.g., 'alex', 'david')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
        />
      </div>

      {/* Results viewport */}
      <div className="flex flex-col gap-3">
        {loading ? (
          // Skeletons
          [1, 2].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-gray-150 p-5 flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-150"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-gray-150 rounded"></div>
                <div className="h-2.5 w-16 bg-gray-150 rounded"></div>
              </div>
            </div>
          ))
        ) : query.trim() && results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-150 p-10 text-center flex flex-col items-center gap-2">
            <h4 className="text-xs font-bold text-gray-800">No users found</h4>
            <p className="text-[11px] text-gray-400">Try checking your spelling or search using another keyword.</p>
          </div>
        ) : !query.trim() ? (
          <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center flex flex-col items-center gap-2.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 mt-1">Start Exploring</h4>
            <p className="text-[11px] text-gray-400 max-w-sm">Type a developer\'s name or handle into the box above to find and connect with them.</p>
          </div>
        ) : (
          results.map((r) => {
            const isFollowing = currentUser?.following.includes(r._id);
            const isSelf = currentUser?._id === r._id;

            return (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm flex items-center justify-between gap-4">
                <Link to={`/profile/${r._id}`} className="flex items-center gap-3.5 min-w-0 hover:opacity-90 group cursor-pointer">
                  {r.profilePicture ? (
                    <img
                      src={r.profilePicture}
                      alt={r.name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-150 shrink-0 text-lg">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate leading-tight">
                      {r.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">@{r.username}</p>
                    {r.bio && <p className="text-[11px] text-gray-500 truncate mt-1 max-w-md">{r.bio}</p>}
                  </div>
                </Link>

                {/* Follow/Unfollow toggle (only if not self) */}
                {!isSelf && (
                  <button
                    onClick={() => toggleFollow(r._id, !isFollowing)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isFollowing
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-100'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
