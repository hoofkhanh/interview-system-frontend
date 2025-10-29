"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, BarChart3, Shield, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {isAuthenticated ? (
                <>
                  Chào mừng trở lại, <span className="text-blue-600">{user?.fullName}</span>!
                </>
              ) : (
                <>
                  Hệ thống phỏng vấn
                  <span className="text-blue-600"> thông minh</span>
                </>
              )}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {isAuthenticated
                ? "Tiếp tục quản lý các cuộc phỏng vấn của bạn một cách chuyên nghiệp."
                : "Tạo và quản lý các cuộc phỏng vấn một cách chuyên nghiệp."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                    Vào Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup-interviewer">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                      Đăng kí miễn phí cho nhà tuyển dụng
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg">
                      Đăng nhập
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-gray-600">
              Công cụ mạnh mẽ giúp bạn tối ưu hóa quy trình tuyển dụng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quản lý ứng viên</h3>
              <p className="text-gray-600">
                Tổ chức và theo dõi thông tin ứng viên một cách hiệu quả với hệ thống quản lý thông minh.
              </p>
            </div>

            <div className="bg-linear-to-br from-green-50 to-green-100 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lên lịch tự động</h3>
              <p className="text-gray-600">
                Tự động sắp xếp lịch phỏng vấn, gửi thông báo và nhắc nhở cho cả ứng viên và nhà tuyển dụng.
              </p>
            </div>

            <div className="bg-linear-to-br from-purple-50 to-purple-100 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Báo cáo chi tiết</h3>
              <p className="text-gray-600">
                Phân tích và báo cáo hiệu suất tuyển dụng với các biểu đồ trực quan và dữ liệu thống kê.
              </p>
            </div>

            <div className="bg-linear-to-br from-orange-50 to-orange-100 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Bảo mật cao</h3>
              <p className="text-gray-600">
                Bảo vệ thông tin ứng viên và dữ liệu công ty với các tiêu chuẩn bảo mật quốc tế.
              </p>
            </div>

            <div className="bg-linear-to-br from-red-50 to-red-100 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-red-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Tích hợp AI</h3>
              <p className="text-gray-600">
                Sử dụng trí tuệ nhân tạo để đánh giá ứng viên, gợi ý câu hỏi và tối ưu hóa quy trình.
              </p>
            </div>

            <div className="bg-linear-to-br from-indigo-50 to-indigo-100 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Hợp tác nhóm</h3>
              <p className="text-gray-600">
                Làm việc cùng đội ngũ HR với các công cụ chia sẻ và cộng tác hiệu quả.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {isAuthenticated ? "Tiếp tục công việc của bạn" : "Sẵn sàng bắt đầu?"}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {isAuthenticated
              ? "Quản lý các cuộc phỏng vấn và ứng viên một cách hiệu quả"
              : "Tham gia cùng hàng nghìn công ty đã tin tưởng hệ thống của chúng tôi"
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold">
                  Vào Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup-interviewer">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold">
                    Đăng ký ngay
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg">
                    Đăng nhập
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Interview System</h3>
            <p className="text-gray-400 mb-6">
              Hệ thống phỏng vấn thông minh cho doanh nghiệp hiện đại
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                Về chúng tôi
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                Liên hệ
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Chính sách
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
