import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-gray-150 rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <HelpCircle className="w-6 h-6 animate-pulse" />
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">404 - Path Misaligned</h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">The file, component, or channel you are looking for has been moved or is outside our navigation trees.</p>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-blue-100 transition-all cursor-pointer mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to active feeds</span>
        </Link>
      </motion.div>
    </div>
  );
};
