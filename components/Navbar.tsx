"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { User, Settings } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="shrink-0">
                <Link href="/">
                  <h1 className="text-2xl font-bold text-gray-800">Hệ Thống Phỏng Vấn</h1>
                </Link>
              </div>
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  // Hide navbar for candidates
  if (isAuthenticated && user?.role?.name === 'CANDIDATE') {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-gray-800">Hệ Thống Phỏng Vấn</h1>
              </Link>
            </div>

            {/* Navigation Menu - Only show if authenticated */}
            {isAuthenticated && (
              <div className="hidden md:block ml-10">
                <NavigationMenu>
                  <NavigationMenuList className="flex space-x-8">
                    {isAuthenticated && (
                      <>
                        <NavigationMenuItem>
                          <NavigationMenuTrigger className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Phỏng vấn
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <div className="w-48 p-2">
                              <NavigationMenuLink asChild>
                                <Link
                                  href="/dashboard/interview/create"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                  Tạo cuộc phỏng vấn
                                </Link>
                              </NavigationMenuLink>

                              <NavigationMenuLink asChild>
                                <Link
                                  href="/dashboard/interview/list"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                  Danh sách phỏng vấn
                                </Link>
                              </NavigationMenuLink>
                            </div>
                          </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                          <NavigationMenuTrigger className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Quản lý
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <div className="w-48 p-2">
                              <NavigationMenuLink asChild>
                                <Link
                                  href="/dashboard/question"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                  Tạo câu hỏi
                                </Link>
                              </NavigationMenuLink>
                              <NavigationMenuLink asChild>
                                <Link
                                  href="/dashboard/session"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                  Tạo phòng
                                </Link>
                              </NavigationMenuLink>
                            </div>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      </>
                    )}
                  </NavigationMenuList>
                  <NavigationMenuViewport />
                </NavigationMenu>
              </div>
            )}
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{user?.fullName || (typeof window !== 'undefined' ? localStorage.getItem('username') : null) || 'User'}</span>
                  {user?.role?.name && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-blue-600">{user.role.name}</span>
                    </>
                  )}
                </div>

                {/* Logout Button */}
                <LogoutButton />
              </>
            ) : (
              /* Login/Signup buttons for non-authenticated users */
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/signup-interviewer">
                  <Button size="sm">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav >
  );
}
