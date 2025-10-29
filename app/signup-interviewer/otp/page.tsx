"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Mail, Shield, CheckCircle } from "lucide-react";

// Form validation schema for OTP verification
const formSchema = z.object({
  otp: z.string().min(6, "OTP phải có ít nhất 6 ký tự").max(6, "OTP phải có đúng 6 ký tự"),
  email: z.string().email("Email không hợp lệ"),
});

// GraphQL mutation for OTP verification
const VERIFY_OTP_MUTATION = `
  mutation VerifyInterviewerSignupOtp($input: VerifyInterviewerSignupOtpInput!) {
    verifyInterviewerSignupOtp(input: $input) {
      status
      metadata {
        success
        message
      }
      payload {
        accessToken
        refreshToken
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

// Function to call GraphQL API
const verifyOtp = async (variables: any) => {
  const response = await axios.post(
    process.env.NEXT_PUBLIC_AUTH_ENDPOINT || '',
    {
      query: VERIFY_OTP_MUTATION,
      variables,
    },
    {
      headers: { "Content-Type": "application/json" }
    }
  );
  return response.data;
};

// Component that uses useSearchParams
function OTPVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
      email: "",
    },
  });

  // Get email from URL params and set it to form
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      form.setValue('email', emailFromUrl);
    }
  }, [searchParams, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const mutationData = {
        input: {
          otp: values.otp,
          email: values.email,
        }
      };

      const result = await verifyOtp(mutationData);

      // Handle response
      const verifyResponse = (result.data as any)?.verifyInterviewerSignupOtp;
      if (verifyResponse?.metadata?.success) {
        // Show success toast
        toast.success("Xác thực OTP thành công! Đang chuyển hướng...");

        // Store user data and token in context
        const accessToken = verifyResponse?.payload?.accessToken;
        const userData = verifyResponse?.payload?.baseAuth;
        const refreshToken = verifyResponse?.payload?.refreshToken;

        if (accessToken && userData) {
          login(userData, accessToken);
        }

        // Store refresh token in localStorage
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        form.reset();

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          router.push("/dashboard"); // SPA navigation
        }, 1500);
      } else {
        // Show error toast based on status
        const status = verifyResponse?.status;
        let errorMessage = "Có lỗi xảy ra khi xác thực OTP";

        if (status === "OTP_EXPIRED") {
          errorMessage = "Mã OTP đã hết hạn. Vui lòng đăng ký lại.";
          toast.error(errorMessage);
          // Redirect to signup page after showing error
          setTimeout(() => {
            router.push('/signup-interviewer');
          }, 2000);
        } else if (status === "OTP_INVALID") {
          errorMessage = "Mã OTP không đúng. Vui lòng kiểm tra lại.";
          toast.error(errorMessage);
        } else {
          errorMessage = verifyResponse?.metadata?.message || errorMessage;
          toast.error(errorMessage);
        }

        setErrorMessage(errorMessage);
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      const errorMsg = error.message || "Có lỗi xảy ra khi xác thực OTP";
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

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

        {/* OTP Verification Card */}
        <Card className="shadow-xl border-blue-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Xác thực OTP
            </CardTitle>
            <CardDescription className="text-gray-600">
              Nhập mã OTP đã được gửi đến email của bạn
            </CardDescription>
            {searchParams.get('email') && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Email:</strong> {searchParams.get('email')}
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {successMessage}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {errorMessage}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Nhập email của bạn"
                            className="pl-10 bg-gray-50"
                            disabled
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* OTP */}
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Mã OTP
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Nhập mã OTP 6 số"
                          maxLength={6}
                          className="text-center text-lg tracking-widest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 disabled:opacity-50"
                >
                  {isLoading ? "Đang xác thực..." : "Xác thực OTP"}
                </Button>
              </form>
            </Form>

            {/* Resend OTP Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Không nhận được mã?{" "}
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Gửi lại OTP
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function OTPVerificationLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center text-blue-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại trang chủ
          </div>
        </div>
        <Card className="shadow-xl border-blue-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Xác thực OTP
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
export default function OTPVerificationPage() {
  return (
    <Suspense fallback={<OTPVerificationLoading />}>
      <OTPVerificationForm />
    </Suspense>
  );
}