import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { 
  Sparkles, 
  Layers, 
  MessageCircle, 
  Heart, 
  ShieldCheck, 
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export const Landing: React.FC = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect them directly to home feed!
  if (user) {
    return <Navigate to="/" replace />;
  }

  const features = [
    {
      icon: Layers,
      title: 'Durable Media Feed',
      desc: 'Publish rich media posts with captions, view likes, and engage with threaded comment networks.'
    },
    {
      icon: MessageCircle,
      title: 'Database-Backed Chats',
      desc: 'Send private direct messages to fellow developers and creatives, stored securely on our endpoints.'
    },
    {
      icon: Heart,
      title: 'Dynamic Engagement',
      desc: 'Show appreciation through liking posts, leaving responses, and receiving instant updates.'
    },
    {
      icon: ShieldCheck,
      title: 'JWT Authentication',
      desc: 'Protected client pathways, password hashing with bcrypt, and secure user profile editing fields.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-gray-50 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-150">
            <Sparkles className="w-5.5 h-5.5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            ymedia
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Sign In
          </Link>
          <Link 
            to="/register" 
            className="text-sm font-semibold gradient-btn-secondary text-white px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02]"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto w-full px-6 py-16 md:py-24 text-center flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl flex flex-col items-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-6 shadow-sm border border-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent font-bold">Introducing ymedia Platforms</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            The next generation social hub for{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              modern developers.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-500 max-w-xl leading-relaxed">
            Connect, collaborate, and share your creation journey. Built with a full-stack MVC schema incorporating clean JWT security and responsive client design.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 gradient-btn text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-purple-100 hover:scale-[1.02] transition-all cursor-pointer text-sm"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer text-sm shadow-sm"
            >
              Learn More
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 text-left">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{feat.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-medium">
          <p>© 2026 ymedia SocialMediaPlatform. Suitable for Internship project submission.</p>
          <div className="flex gap-6">
            <span>React 19 + Vite</span>
            <span>Node.js + Express</span>
            <span>MongoDB Atlas</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
