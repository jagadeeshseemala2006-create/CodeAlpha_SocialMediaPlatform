import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Notification } from '../types.js';
import { formatTimeAgo } from '../utils.js';
import { Bell, Heart, MessageSquare, UserPlus, CheckCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const Notifications: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Error marking notifications read:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    markAsRead(); // Mark read when page loads
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 pb-24 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h2>
          <p className="text-xs text-gray-400">Track likes, responses, and new connections from fellow developers.</p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>All Read</span>
          </div>
        )}
      </div>

      {/* Notifications List View */}
      <div className="flex flex-col gap-3">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-gray-150 p-5 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-150"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 bg-gray-150 rounded"></div>
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center flex flex-col items-center gap-2.5 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Bell className="w-5.5 h-5.5" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 mt-1">No Notifications</h4>
            <p className="text-[11px] text-gray-400 max-w-sm">When developers follow you, like your posts, or drop comment threads, they'll show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifications.map((n) => {
              const sender = n.sender;
              const timeAgo = formatTimeAgo(n.createdAt);

              // Config details per notification type
              let iconElement = null;
              let descriptionText = '';
              let targetPath = '';

              if (n.type === 'follow') {
                iconElement = <UserPlus className="w-4 h-4 text-blue-500" />;
                descriptionText = 'started following you';
                targetPath = `/profile/${sender._id}`;
              } else if (n.type === 'like') {
                iconElement = <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
                descriptionText = 'liked your post';
                targetPath = `/posts/${n.postId}`;
              } else if (n.type === 'comment') {
                iconElement = <MessageSquare className="w-4 h-4 text-indigo-500" />;
                descriptionText = 'commented on your post';
                targetPath = `/posts/${n.postId}`;
              }

              return (
                <Link
                  key={n._id}
                  to={targetPath}
                  className={`flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-150 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
                    !n.isRead ? 'border-l-4 border-l-blue-500 pl-3.5' : ''
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className="relative shrink-0">
                    {sender.profilePicture ? (
                      <img
                        src={sender.profilePicture}
                        alt={sender.name}
                        className="w-11 h-11 rounded-full object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-150">
                        {sender.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Tiny Type Icon floating */}
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center scale-90">
                      {iconElement}
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="text-gray-800 leading-normal">
                      <span className="font-bold text-gray-900 hover:underline">@{sender.username}</span>{' '}
                      <span className="text-gray-500 font-medium">{descriptionText}</span>
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block">{timeAgo}</span>
                  </div>

                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
