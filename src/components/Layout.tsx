import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { 
  Home, 
  Search, 
  MessageSquare, 
  PlusSquare, 
  Bell, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu,
  Sparkles
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Poll for notifications unread count
  useEffect(() => {
    if (!token) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const unread = data.notifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (e) {
        console.error('Error fetching unread notifications:', e);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [token, location.pathname]);

  if (!user) {
    return <Outlet />;
  }

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Create', path: '/create', icon: PlusSquare },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Profile', path: `/profile/${user._id}`, icon: UserIcon },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row font-sans">
      
      {/* 1. DESKTOP/TABLET SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 xl:w-72 border-r border-gray-200 bg-white h-screen sticky top-0 px-6 py-8 justify-between shrink-0">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-150">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              ymedia
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path.startsWith('/profile') && location.pathname.startsWith('/profile'));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5.5 h-5.5 shrink-0 transition-transform duration-250 group-hover:scale-105 ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-700'
                  }`} />
                  <span className="truncate">{item.label}</span>
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute right-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-tight min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="flex flex-col gap-4 border-t border-gray-150 pt-6">
          <Link 
            to={`/profile/${user._id}`} 
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
          >
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {user.name}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                @{user.username}
              </p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE TOP HEADER */}
      <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            ymedia
          </span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Link to="/notifications" className="relative p-1 text-gray-500 hover:text-gray-900 cursor-pointer">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
            )}
          </Link>
          <Link to="/settings" className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer">
            <SettingsIcon className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* 3. MAIN CONTAINER VIEWPORT */}
      <main className="flex-1 overflow-y-auto h-screen-mobile md:h-screen">
        <Outlet />
      </main>

      {/* 4. MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2.5 px-6 flex justify-between items-center z-45 shadow-lg">
        {navItems.filter(item => item.label !== 'Settings').map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path.startsWith('/profile') && location.pathname.startsWith('/profile'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative p-1.5 transition-colors cursor-pointer ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-6.5 h-6.5" />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[15px] text-center leading-none">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

    </div>
  );
};
