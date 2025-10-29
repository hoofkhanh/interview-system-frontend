"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

// Component that uses useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/dashboard';
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // GraphQL mutation for signin
  const SIGNIN_MUTATION = `
    mutation Signin {
      signin(input: { username: "interview1", password: "123456" }) {
        status
        metadata {
          success
          message
        }
        payload {
          accessToken
          baseAuth {
            id
            userId
            email
            fullName
            role {
              id
              name
            }
          }
        }
      }
    }
  `;

  // Function to call signin API
  const signinUser = async (username: string, password: string) => {
    const mutation = `
      mutation Signin {
        signin(input: { username: "${username}", password: "${password}" }) {
          status
          metadata {
            success
            message
          }
          payload {
            accessToken
            refreshToken
          }
        }
      }
    `;


    const response = await axios.post(
      process.env.NEXT_PUBLIC_AUTH_ENDPOINT || 'http://localhost:9004/interview-system-auth-service/graphql',
      {
        query: mutation,
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );
    return response.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {


      const result = await signinUser(formData.username, formData.password);

      const signinResponse = (result.data as any)?.signin;

      if (signinResponse?.metadata?.success === true) {
        // Login successful
        const accessToken = signinResponse?.payload?.accessToken;

        if (!accessToken) {
          toast.error("Không nhận được token từ server. Vui lòng thử lại.");
          return;
        }

        // Store access token, username and refresh token
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('username', formData.username);

        // Get refresh token from response if available
        const refreshToken = signinResponse?.payload?.refreshToken;
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
          console.log('Refresh token saved to localStorage:', refreshToken);
        }

        // Dispatch custom event to update auth state
        window.dispatchEvent(new CustomEvent('authStateChanged'));

        // Show success toast
        toast.success("Đăng nhập thành công! Đang chuyển hướng...");

        // Redirect to original target if provided
        setTimeout(() => {
          if (redirectTarget && redirectTarget.startsWith('http')) {
            window.location.href = redirectTarget;
          } else {
            router.push(redirectTarget || '/dashboard');
          }
        }, 800);
      } else {
        // Handle specific error cases based on backend API
        const status = signinResponse?.status;
        const message = signinResponse?.metadata?.message;
        let errorMessage = "Có lỗi xảy ra khi đăng nhập";

        // Map backend status to user-friendly messages
        switch (status) {
          case "USERNAME_NOT_FOUND":
            errorMessage = "Tên đăng nhập không tồn tại. Vui lòng kiểm tra lại.";
            toast.error(errorMessage, {
              duration: 4000,
              style: {
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca'
              }
            });
            break;

          case "PASSWORD_INVALID":
            errorMessage = "Mật khẩu không đúng. Vui lòng thử lại.";
            toast.error(errorMessage, {
              duration: 4000,
              style: {
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca'
              }
            });
            break;

          default:
            // Use message from API or fallback
            errorMessage = message || "Có lỗi xảy ra khi đăng nhập";
            toast.error(errorMessage);
            break;
        }
      }
    } catch (error: any) {
      console.error("Signin error:", error);
      console.error("Error response:", error?.response?.data);
      console.error("Error status:", error?.response?.status);
      let errorMessage = "Có lỗi xảy ra khi đăng nhập";

      // Handle different types of errors
      if (error?.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = "Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại.";
            break;
          case 401:
            errorMessage = "Tên đăng nhập hoặc mật khẩu không đúng.";
            break;
          case 403:
            errorMessage = "Tài khoản của bạn đã bị khóa hoặc không có quyền truy cập.";
            break;
          case 404:
            errorMessage = "Không tìm thấy dịch vụ đăng nhập.";
            break;
          case 429:
            errorMessage = "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ít phút.";
            break;
          case 500:
            errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
            break;
          case 502:
            errorMessage = "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.";
            break;
          case 503:
            errorMessage = "Hệ thống đang bảo trì. Vui lòng thử lại sau.";
            break;
          default:
            // Check if GraphQL error
            if (data?.errors && Array.isArray(data.errors)) {
              const graphqlError = data.errors[0];
              errorMessage = graphqlError.message || "Có lỗi xảy ra khi đăng nhập";
            } else {
              errorMessage = `Lỗi ${status}: ${data?.message || errorMessage}`;
            }
            break;
        }
      } else if (error?.request) {
        // Request was made but no response received
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
      } else if (error?.code === 'NETWORK_ERROR') {
        errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
      } else if (error?.code === 'ECONNABORTED') {
        errorMessage = "Kết nối bị timeout. Vui lòng thử lại.";
      } else if (error?.message) {
        // Other errors
        if (error.message.includes('timeout')) {
          errorMessage = "Kết nối bị timeout. Vui lòng thử lại.";
        } else if (error.message.includes('Network Error')) {
          errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại trang chủ
          </Link>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-gray-600">
              Đăng nhập vào tài khoản của bạn
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Tên đăng nhập
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    className="pl-10"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 disabled:opacity-50"
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            {/* Test Credentials */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Test Credentials:</h4>
              <p className="text-xs text-yellow-700">Username: interview1</p>
              <p className="text-xs text-yellow-700">Password: 123456</p>
            </div>

            {/* Signup Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <Link href="/signup-interviewer" className="text-blue-600 hover:text-blue-700 font-medium">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function LoginLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center text-blue-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại trang chủ
          </div>
        </div>
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-gray-600">
              Đang tải...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
