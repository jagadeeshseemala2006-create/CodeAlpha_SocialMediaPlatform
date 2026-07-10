import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { User, Message } from '../types.js';
import { Send, ArrowLeft, MessageSquare, Loader2, User as UserIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const Messages: React.FC = () => {
  const { user: currentUser, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Users and Chat Lists
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [text, setText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  // Selected user from URL query "?user=123"
  const targetUserIdFromUrl = searchParams.get('user');

  // 1. Fetch available contact list (e.g. all users in the system)
  useEffect(() => {
    if (!token) return;

    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/users/search?q=', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Exclude self from contact lists
          const list = (data.users || []).filter((u: User) => u._id !== currentUser?._id);
          setUsers(list);

          // If there is a target user from URL, select them
          if (targetUserIdFromUrl) {
            const found = list.find((u: User) => u._id === targetUserIdFromUrl);
            if (found) {
              setActiveUser(found);
            } else {
              // Fetch individually if not in list
              const userRes = await fetch(`/api/users/${targetUserIdFromUrl}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                setActiveUser(userData.user);
              }
            }
          } else if (list.length > 0 && !activeUser) {
            // Default select first contact on desktop
            setActiveUser(list[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchContacts();
  }, [token, targetUserIdFromUrl, currentUser?._id]);

  // 2. Fetch messages for active conversation
  const fetchMessages = async (silent = false) => {
    if (!token || !activeUser) return;
    if (!silent) setLoadingMessages(true);
    
    try {
      const res = await fetch(`/api/messages/${activeUser._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages(false);
  }, [activeUser, token]);

  // Scroll to bottom when message log loads
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Live Poll messages every 4 seconds to simulate real-time replies
  useEffect(() => {
    if (!activeUser || !token) return;

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeUser, token]);

  // 4. Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeUser || !token || sending) return;

    setSending(true);
    const content = text.trim();
    setText(''); // clear input instantly for great UX

    // Optimistic Append locally
    const tempId = Math.random().toString(36).substr(2, 9);
    const tempMsg: Message = {
      _id: tempId,
      sender: currentUser?._id || '',
      receiver: activeUser._id,
      text: content,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activeUser._id,
          text: content
        })
      });

      if (!res.ok) {
        showToast('Message failed to transmit.', 'error');
        // Remove optimistic append on failure
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      } else {
        // Hydrate with official backend record
        const data = await res.json();
        if (data.messageObj) {
          setMessages((prev) => prev.map((m) => (m._id === tempId ? data.messageObj : m)));
        }
      }
    } catch (err) {
      showToast('Connection error.', 'error');
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 h-full pb-20">
      
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] overflow-hidden grid grid-cols-1 md:grid-cols-3">
        
        {/* LEFT COLUMN: Contact List (Collapses on mobile if active user is selected) */}
        <div className={`border-r border-gray-150 flex flex-col h-full bg-white ${
          activeUser && targetUserIdFromUrl ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Direct Messages
            </h3>
            <p className="text-[10px] text-gray-400 font-medium">Select a teammate to initiate secure chat channels.</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2 space-y-1">
            {loadingUsers ? (
              <div className="flex items-center justify-center p-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-xs font-semibold">Loading team...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">No teammates found.</div>
            ) : (
              users.map((u) => {
                const isActive = activeUser?._id === u._id;
                return (
                  <button
                    key={u._id}
                    onClick={() => {
                      setActiveUser(u);
                      navigate(`/messages?user=${u._id}`, { replace: true });
                    }}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                      isActive ? 'bg-blue-50/75 border-l-4 border-l-blue-500 pl-2' : 'hover:bg-gray-50'
                    }`}
                  >
                    {u.profilePicture ? (
                      <img
                        src={u.profilePicture}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>{u.name}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">@{u.username}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chat Log Pane */}
        <div className={`md:col-span-2 flex flex-col h-full bg-gray-50/30 ${
          !activeUser ? 'hidden md:flex items-center justify-center' : 'flex'
        }`}>
          {activeUser ? (
            <>
              {/* Active User Header */}
              <div className="px-5 py-3.5 border-b border-gray-150 bg-white flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => {
                    setActiveUser(null);
                    navigate('/messages', { replace: true });
                  }}
                  className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer mr-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <Link to={`/profile/${activeUser._id}`} className="flex items-center gap-3 cursor-pointer hover:opacity-90">
                  {activeUser.profilePicture ? (
                    <img
                      src={activeUser.profilePicture}
                      alt={activeUser.name}
                      className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 border border-blue-100">
                      {activeUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{activeUser.name}</h4>
                    <p className="text-[10px] text-gray-400 leading-none">@{activeUser.username}</p>
                  </div>
                </Link>
                
                {/* Online Status Mimic */}
                <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Active</span>
                </span>
              </div>

              {/* Message Thread History */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                    <h4 className="text-xs font-bold text-gray-900 mt-2">No messages yet</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Send a greeting to start chatting with @{activeUser.username}!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwnMessage = m.sender === currentUser?._id;

                    return (
                      <div
                        key={m._id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs font-medium shadow-sm leading-relaxed ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white border border-gray-150 text-gray-800 rounded-bl-none'
                          }`}
                        >
                          <p>{m.text}</p>
                          <span className={`text-[8px] mt-1 block text-right font-semibold ${
                            isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                {/* Anchor for scroll */}
                <div ref={chatScrollRef} />
              </div>

              {/* Message Composer Footer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-150 bg-white flex items-center gap-3">
                <input
                  type="text"
                  placeholder={`Send a message to @${activeUser.username}...`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-45 text-white p-3 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Choose a Conversation</h4>
              <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">Select a user from the sidebar contacts or browse search directories to message teammates directly.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
