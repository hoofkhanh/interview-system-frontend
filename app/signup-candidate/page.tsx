"use client";

import React, { useState, Suspense } from 'react';
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
import { ArrowLeft, Mail, Lock, User, Phone, Calendar, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form validation schema for candidate
const formSchema = z.object({
  firstName: z.string().min(1, "Tên không được để trống"),
  lastName: z.string().min(1, "Họ không được để trống"),
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phoneNumber: z.string().min(1, "Số điện thoại không được để trống"),
  dateOfBirth: z.string().min(1, "Ngày sinh không được để trống"),
  gender: z.boolean(),
});

const SIGNUP_CANDIDATE_MUTATION = `
  mutation SignupCandidate($input: SignupCandidateInput!) {
    signupCandidate(input: $input) {
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

// Component that uses useSearchParams
function SignupCandidateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/dashboard';
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // GraphQL mutation function using axios
  const signupCandidate = async (variables: any) => {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_AUTH_ENDPOINT || '',
      {
        query: SIGNUP_CANDIDATE_MUTATION,
        variables,
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );
    return response.data;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      gender: true, // true for male, false for female
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Format data for GraphQL mutation - exactly matching the mutation structure
      const mutationData = {
        input: {
          baseSignup: {
            roleId: "2", // Fixed roleId for candidate
            email: values.email,
            phoneNumber: values.phoneNumber,
            gender: values.gender,
            firstName: values.firstName,
            lastName: values.lastName,
            fullName: values.fullName,
            dateOfBirth: values.dateOfBirth,
          }
        }
      };

      const result = await signupCandidate(mutationData);

      // Fix: protect against missing data shape and suppress type error.
      const signupResponse = (result.data as any)?.signupCandidate;
      if (signupResponse?.metadata?.success) {
        toast.success("Đăng ký thành công! Đang chuyển hướng...");
        setSuccessMessage("Đăng ký thành công! Bạn đã được đăng nhập tự động.");

        // Store user data and token in context
        const accessToken = signupResponse?.payload?.accessToken;
        const userData = signupResponse?.payload?.baseAuth;
        const refreshToken = signupResponse?.payload?.refreshToken;

        if (accessToken && userData) {
          // Save tokens like login page
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          if (userData?.email) {
            localStorage.setItem('username', userData.email);
          } else if (values.email) {
            localStorage.setItem('username', values.email);
          }
          // Update auth context
          login(userData, accessToken);
          // Notify listeners (same as login page)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('authStateChanged'));
          }
        }

        form.reset();
        // Redirect back to original link (or dashboard) after 800ms
        setTimeout(() => {
          if (redirectTarget.startsWith('http')) {
            window.location.href = redirectTarget;
          } else {
            router.push(redirectTarget);
          }
        }, 800);
      } else {
        const errorMsg = signupResponse?.metadata?.message || "Có lỗi xảy ra khi đăng ký";
        toast.error(errorMsg);
        setErrorMessage(errorMsg);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMsg = error.message || "Có lỗi xảy ra khi đăng ký";
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại trang chủ
          </Link>
        </div>

        {/* Signup Card */}
        <Card className="shadow-xl border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Đăng ký ứng viên
            </CardTitle>
            <CardDescription className="text-gray-600">
              Tạo tài khoản ứng viên để tham gia phỏng vấn
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-md">
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
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Tên
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="Nhập tên"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Họ
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="Nhập họ"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Họ và tên đầy đủ
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="Nhập họ và tên đầy đủ"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Nhập email của bạn"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Số điện thoại
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Nhập số điện thoại"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Ngày sinh
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="date"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Giới tính
                      </FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn giới tính" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Nam</SelectItem>
                          <SelectItem value="false">Nữ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 disabled:opacity-50"
                >
                  {isLoading ? "Đang đăng ký..." : "Đăng ký ứng viên"}
                </Button>
              </form>
            </Form>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Đăng nhập ngay
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
function SignupCandidateLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center text-green-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại trang chủ
          </div>
        </div>
        <Card className="shadow-xl border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Đăng ký ứng viên
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
export default function SignupCandidatePage() {
  return (
    <Suspense fallback={<SignupCandidateLoading />}>
      <SignupCandidateForm />
    </Suspense>
  );
}