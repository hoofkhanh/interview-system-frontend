"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import axios from 'axios';
import { fetchNewAccessToken, redirectToLogin } from '@/services/authService';
import { LogoutButtonProps } from '@/types';

export default function LogoutButton({
  variant = "outline",
  size = "sm",
  className = "",
  children
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // GraphQL mutation for logout - FAKE 401 ERROR FOR TESTING
  const LOGOUT_MUTATION = `
    mutation Logout($refreshToken: String!) {
      logout(refreshToken: $refreshToken) {
        metadata {
          success
          message
        }
      }
    }
  `;

  // Function to call logout API
  const callLogoutAPI = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      redirectToLogin();
      return;
    }
    if (!accessToken) {
      redirectToLogin();
      return;
    }




    try {
      // Simulate token expired for test only
      const response = await axios.post(
        process.env.NEXT_PUBLIC_AUTH_ENDPOINT || 'http://localhost:9004/interview-system-auth-service/graphql',
        {
          query: LOGOUT_MUTATION,
          variables: { refreshToken }
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          },
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const newAccessToken = await fetchNewAccessToken(refreshToken);

        if (!newAccessToken) {
          // Xử lý logout/redirect khi refresh token cũng failed
          redirectToLogin();
          return;
        }

        // Lưu lại accessToken mới
        localStorage.setItem('accessToken', newAccessToken);

        // Retry logout with refreshed accessToken
        const retryResponse = await axios.post(
          process.env.NEXT_PUBLIC_AUTH_ENDPOINT || 'http://localhost:9004/interview-system-auth-service/graphql',
          {
            query: LOGOUT_MUTATION,
            variables: { refreshToken },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`
            },
            withCredentials: true
          }
        );
        return retryResponse.data;
      } else {
        throw error;
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await callLogoutAPI();

      // Always call local logout regardless of API result
      // Clear localStorage and update state manually
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('username');
      localStorage.removeItem('refreshToken');

      // Dispatch custom event to update auth state
      window.dispatchEvent(new CustomEvent('authStateChanged'));

      // Redirect to home
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, still logout locally
      // Clear localStorage and update state manually
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('username');
      localStorage.removeItem('refreshToken');

      // Dispatch custom event to update auth state
      window.dispatchEvent(new CustomEvent('authStateChanged'));

      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      disabled={isLoggingOut}
      className={`flex items-center space-x-2 text-gray-600 hover:text-red-600 hover:border-red-300 ${className}`}
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span>{children || "Đăng xuất"}</span>
    </Button>
  );
}
