import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Sparkles, ArrowRight, Lock, User as UserIcon, Mail, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export const Register: React.FC = () => {
  const { register, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // If already logged in, redirect to feed
  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!name.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      showToast('All fields are required.', 'error');
      return;
    }

    if (username.length < 3) {
      showToast('Username must be at least 3 characters long.', 'error');
      return;
    }

    // Check spaces in username
    if (/\s/.test(username)) {
      showToast('Username cannot contain spaces.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setSubmitting(true);
    const success = await register(
      name.trim(), 
      username.trim().toLowerCase(), 
      email.trim().toLowerCase(), 
      password
    );
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
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
            <p className="text-xs text-gray-400 mt-1">Join the ymedia developer platform today.</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Full Name</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Username</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 font-medium text-xs">@</span>
              <input
                type="text"
                required
                placeholder="alex_codes"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl pl-8 pr-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Email Address</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Password</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Confirm Password</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 gradient-btn text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm shadow-md hover:scale-[1.02] cursor-pointer mt-2"
          >
            {submitting ? 'Registering...' : 'Sign Up'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center border-t border-gray-100 pt-5 text-xs text-gray-400 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline cursor-pointer">
            Sign In
          </Link>
        </div>

      </motion.div>
    </div>
  );
};
