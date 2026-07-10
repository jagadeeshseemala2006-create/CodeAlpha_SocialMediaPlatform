import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { useToast } from './ToastContext.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  register: (name: string, username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { password?: string }) => Promise<boolean>;
  toggleFollow: (targetId: string, isFollow: boolean) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        // Token expired or invalid
        localStorage.removeItem('ymedia_token');
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.error('Error fetching auth profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('ymedia_token');
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        localStorage.setItem('ymedia_token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast('Successfully logged in!', 'success');
        return true;
      } else {
        showToast(data.error || 'Invalid credentials.', 'error');
        return false;
      }
    } catch (e) {
      showToast('Connection error, try again later.', 'error');
      return false;
    }
  };

  const register = async (name: string, username: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        localStorage.setItem('ymedia_token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast('Registration successful! Welcome!', 'success');
        return true;
      } else {
        showToast(data.error || 'Registration failed.', 'error');
        return false;
      }
    } catch (e) {
      showToast('Connection error, try again later.', 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('ymedia_token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.', 'info');
  };

  const updateProfile = async (data: Partial<User> & { password?: string }): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (res.ok && resData.user) {
        setUser(resData.user);
        showToast('Profile updated successfully!', 'success');
        return true;
      } else {
        showToast(resData.error || 'Failed to update profile.', 'error');
        return false;
      }
    } catch (e) {
      showToast('Connection error.', 'error');
      return false;
    }
  };

  const toggleFollow = async (targetId: string, isFollow: boolean): Promise<boolean> => {
    if (!token || !user) return false;
    const action = isFollow ? 'follow' : 'unfollow';
    try {
      const res = await fetch(`/api/users/${action}/${targetId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Sync follow list locally
        setUser((prev) => {
          if (!prev) return null;
          const following = isFollow
            ? [...prev.following, targetId]
            : prev.following.filter((id) => id !== targetId);
          return { ...prev, following };
        });
        showToast(isFollow ? 'User followed' : 'User unfollowed', 'success');
        return true;
      } else {
        const errData = await res.json();
        showToast(errData.error || `Failed to ${action} user.`, 'error');
        return false;
      }
    } catch (e) {
      showToast('Connection error.', 'error');
      return false;
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, toggleFollow, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
