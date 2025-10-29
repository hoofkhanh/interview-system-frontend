"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { User, AuthContextType } from '@/types';

// Extend Window interface for custom events
declare global {
  interface Window {
    addEventListener(type: 'authStateChanged', listener: () => void): void;
    removeEventListener(type: 'authStateChanged', listener: () => void): void;
    dispatchEvent(event: CustomEvent): void;
  }
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for stored auth data on mount
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    const username = localStorage.getItem('username');

    if (token) {
      setIsAuthenticated(true);
      // If we have userData, parse and set it
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('userData');
        }
      }
      // If no userData but have token, that's still authenticated
    } else {
      setIsAuthenticated(false);
    }

    // Axios interceptors removed - using manual token refresh in individual API calls

    setLoading(false);
  }, []);

  // Listen for storage changes (when login from another tab/window)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setIsAuthenticated(true);
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setLoggedOut(false);
  };

  // Listen for custom auth events
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setIsAuthenticated(true);
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        console.log('Setting isAuthenticated to false');
      }
    };

    // Listen for custom auth events
    window.addEventListener('authStateChanged', handleAuthChange);
    return () => window.removeEventListener('authStateChanged', handleAuthChange);
  }, []);

  const logout = async () => {
    try {
      // Call logout API - this will use axios interceptor for token refresh
      // await logoutUser(); // Comment out to avoid double logout call
      toast.success("Đã đăng xuất thành công!");
    } catch (error) {
      console.error('Logout API error:', error);
      // If logout fails due to token issues, the interceptor will handle it
      // and redirect to login automatically
      toast.error("Có lỗi khi đăng xuất, nhưng đã xóa dữ liệu local");
    } finally {
      // Always clear local data regardless of API result
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('username');
      localStorage.removeItem('refreshToken');
    }
  };

  // Component to handle redirect when logged out
  function RedirectOnLogout() {
    useEffect(() => {
      if (loggedOut) {
        router.push('/login');
      }
    }, [loggedOut, router]);
    return null;
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      loading
    }}>
      <RedirectOnLogout />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
