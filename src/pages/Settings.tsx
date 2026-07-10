import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Key, 
  LogOut, 
  Activity, 
  Database,
  ArrowRight,
  ShieldCheck,
  Code
} from 'lucide-react';
import { motion } from 'motion/react';

export const Settings: React.FC = () => {
  const { user, token, logout, updateProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [changing, setChanging] = useState<boolean>(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) return;

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setChanging(true);
    const success = await updateProfile({ password });
    setChanging(false);

    if (success) {
      setPassword('');
      setConfirm('');
      showToast('Your security credentials have been updated.', 'success');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 pb-24 flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5.5 h-5.5 text-blue-600 animate-spin-slow" />
          Platform Settings
        </h2>
        <p className="text-xs text-gray-400">Configure your credentials, check server diagnostics, or log out of current paths.</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* 1. PASSWORD SETTINGS */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-500" />
            Security & Change Password
          </h3>

          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">New Password</label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={changing || !password || !confirm}
              className="self-end px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-100 cursor-pointer"
            >
              {changing ? 'Updating credentials...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* 2. DIAGNOSTICS */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Workspace Diagnostics
          </h3>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600 font-medium">
                <Database className="w-4 h-4 text-gray-400" />
                <span>Backend Core</span>
              </div>
              <span className="font-semibold text-blue-600">Active</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                <span>JWT Authentication Layer</span>
              </div>
              <span className="font-semibold text-emerald-600">Online & Encrypted</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600 font-medium">
                <Code className="w-4 h-4 text-gray-400" />
                <span>Environment Target</span>
              </div>
              <span className="font-mono text-[10px] text-gray-500">production_v1.0</span>
            </div>
          </div>
        </div>

        {/* 3. LOGOUT ACTION BOX */}
        <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6 flex flex-col gap-3">
          <div>
            <h4 className="text-sm font-bold text-red-700">Logout Session</h4>
            <p className="text-[11px] text-red-600/70 leading-relaxed mt-0.5">Disconnect from active credentials and revert back to landing directories.</p>
          </div>
          <button
            onClick={logout}
            className="self-start flex items-center gap-2 bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-100 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>

      </div>

    </div>
  );
};
