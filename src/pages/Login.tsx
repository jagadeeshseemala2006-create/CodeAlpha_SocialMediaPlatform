import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Sparkles, ArrowRight, Lock, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // If already logged in, redirect to feed
  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) return;

    setSubmitting(true);
    const success = await login(usernameOrEmail.trim(), password);
    setSubmitting(false);

    if (success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[16px] border border-[#E2E8F0] vibrant-card-shadow p-8 flex flex-col gap-6"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Link to="/" className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-150">
            <Sparkles className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
            <p className="text-xs text-gray-400 mt-1">Sign in to sync with ymedia social channels.</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Username or Email</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="developer@example.com or alex_codes"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-500">Password</label>
              <span className="text-[10px] text-blue-500 font-semibold hover:underline cursor-pointer">Forgot?</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !usernameOrEmail.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-2 gradient-btn text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm shadow-md hover:scale-[1.02] cursor-pointer mt-2"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center border-t border-gray-100 pt-5 text-xs text-gray-400 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline cursor-pointer">
            Sign Up
          </Link>
        </div>

      </motion.div>
    </div>
  );
};
