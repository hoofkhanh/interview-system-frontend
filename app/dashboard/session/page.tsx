"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Calendar,
  ExternalLink,
  Users,
  Clock,
  Play,
  Pause,
  StopCircle,
  Plus,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { fetchNewAccessToken, redirectToLogin } from "@/services/authService";
import { Session, SessionsResponse } from "@/types";

export default function SessionManagementPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    questionId: "",
    startTime: "",
    title: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch sessions from API
  const fetchSessions = async (page: number = 0, size: number = 10) => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        toast.error("Vui lòng đăng nhập lại");
        redirectToLogin();
        return;
      }

      const response = await axios.post(
        process.env.NEXT_PUBLIC_SESSION_ENDPOINT ||
          "http://localhost:9004/interview-system-session-service/graphql",
        {
          query: `
            query Sessions($page: Int!, $size: Int!) {
              sessions(page: $page, size: $size) {
                basePage {
                  size
                  page
                  totalElements
                  totalPages
                }
                baseSessions {
                  id
                  creatorId
                  questionId
                  link
                  startTime
                  status
                  title
                }
              }
            }
          `,
          variables: {
            page: page,
            size: size,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      const result = response.data?.data?.sessions;
      if (result) {
        setSessions(result.baseSessions || []);
        setTotalElements(result.basePage.totalElements);
        setTotalPages(result.basePage.totalPages);
        setCurrentPage(result.basePage.page);
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách session");
      }
    } catch (error) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        redirectToLogin();
        return;
      }

      console.log("error response", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const newAccessToken = await fetchNewAccessToken(refreshToken);

        if (!newAccessToken) {
          redirectToLogin();
          return;
        }

        localStorage.setItem("accessToken", newAccessToken);
        // Retry with new token
        const retryResponse = await axios.post(
          process.env.NEXT_PUBLIC_SESSION_ENDPOINT ||
            "http://localhost:9004/interview-system-session-service/graphql",
          {
            query: `
              query Sessions($page: Int!, $size: Int!) {
                sessions(page: $page, size: $size) {
                  basePage {
                    size
                    page
                    totalElements
                    totalPages
                  }
                  baseSessions {
                    id
                    creatorId
                    questionId
                    link
                    startTime
                    status
                    title
                  }
                }
              }
            `,
            variables: {
              page: page,
              size: size,
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
            },
            withCredentials: true,
          }
        );

        const retryResult = retryResponse.data?.data?.sessions;
        if (retryResult) {
          setSessions(retryResult.baseSessions || []);
          setTotalElements(retryResult.basePage.totalElements);
          setTotalPages(retryResult.basePage.totalPages);
          setCurrentPage(retryResult.basePage.page);
        }
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách session");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(currentPage, pageSize);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      questionId: "",
      startTime: "",
      title: "",
    });
    setError(null);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.questionId.trim() ||
      !formData.startTime.trim() ||
      !formData.title.trim()
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Check if start time is in the past (Vietnam timezone)
    const selectedDateTime = new Date(formData.startTime);
    const now = new Date();

    // Get current Vietnam time
    const vietnamTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );

    if (selectedDateTime <= vietnamTime) {
      toast.error("Thời gian bắt đầu không được trong quá khứ");
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        toast.error("Vui lòng đăng nhập lại");
        redirectToLogin();
        return;
      }

      const response = await axios.post(
        process.env.NEXT_PUBLIC_SESSION_ENDPOINT ||
          "http://localhost:9004/interview-system-session-service/graphql",
        {
          query: `
            mutation CreateSession($input: CreateSessionInput!) {
              createSession(input: $input) {
                metadata {
                  success
                  message
                }
                status
                payload {
                  baseSessionPayload {
                    id
                    creatorId
                    questionId
                    link
                    startTime
                    status
                    title
                    githubLink
                  }
                }
              }
            }
          `,
          variables: {
            input: {
              baseSession: {
                questionId: formData.questionId.trim(),
                startTime: formData.startTime.trim(),
                status: "PENDING",
                title: formData.title.trim(),
              },
            },
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      const result = response.data?.data?.createSession;

      if (result?.metadata?.success) {
        toast.success("Tạo session thành công!");
        setIsSuccess(true);
        resetForm();
        setShowCreateForm(false);

        // Refresh sessions list
        await fetchSessions(currentPage, pageSize);

        // Reset success state after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        // Handle specific error cases from backend
        const errorMessage =
          result?.metadata?.message || "Có lỗi xảy ra khi tạo session";
        const status = result?.status;

        let displayMessage = errorMessage;

        // Handle specific error cases
        switch (status) {
          case "QUESTION_NOT_FOUND":
            displayMessage = "Không tìm thấy câu hỏi với ID này";
            break;
          case "YOU_NOT_OWNER":
            displayMessage = "Bạn không phải là chủ sở hữu của câu hỏi này";
            break;
          case "TITLE_DUPLICATED":
            displayMessage =
              "Tiêu đề session đã tồn tại. Vui lòng chọn tiêu đề khác";
            break;
          default:
            displayMessage = errorMessage;
        }

        setError(displayMessage);
        toast.error(displayMessage);
      }
    } catch (error) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        redirectToLogin();
        return;
      }

      console.log("error response", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const newAccessToken = await fetchNewAccessToken(refreshToken);

        if (!newAccessToken) {
          redirectToLogin();
          return;
        }

        localStorage.setItem("accessToken", newAccessToken);

        // Retry with new token
        const retryResponse = await axios.post(
          process.env.NEXT_PUBLIC_SESSION_ENDPOINT ||
            "http://localhost:9004/interview-system-session-service/graphql",
          {
            query: `
              mutation CreateSession($input: CreateSessionInput!) {
                createSession(input: $input) {
                  metadata {
                    success
                    message
                  }
                  status
                  payload {
                    baseSessionPayload {
                      id
                      creatorId
                      questionId
                      link
                      startTime
                      status
                      title
                      githubLink
                    }
                  }
                }
              }
            `,
            variables: {
              input: {
                baseSession: {
                  questionId: formData.questionId.trim(),
                  startTime: formData.startTime.trim(),
                  status: "PENDING",
                  title: formData.title.trim(),
                },
              },
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
            },
            withCredentials: true,
          }
        );

        const retryResult = retryResponse.data?.data?.createSession;
        if (retryResult?.metadata?.success) {
          toast.success("Tạo session thành công!");
          setIsSuccess(true);
          resetForm();
          setShowCreateForm(false);
          await fetchSessions(currentPage, pageSize);
          setTimeout(() => setIsSuccess(false), 3000);
        } else {
          // Handle specific error cases from retry
          const errorMessage =
            retryResult?.metadata?.message || "Có lỗi xảy ra khi tạo session";
          const status = retryResult?.status;

          let displayMessage = errorMessage;

          switch (status) {
            case "QUESTION_NOT_FOUND":
              displayMessage = "Không tìm thấy câu hỏi với ID này";
              break;
            case "YOU_NOT_OWNER":
              displayMessage = "Bạn không phải là chủ sở hữu của câu hỏi này";
              break;
            case "TITLE_DUPLICATED":
              displayMessage =
                "Tiêu đề session đã tồn tại. Vui lòng chọn tiêu đề khác";
              break;
            default:
              displayMessage = errorMessage;
          }

          setError(displayMessage);
          toast.error(displayMessage);
        }
      } else {
        console.error("Error creating session:", error);
        setError("Có lỗi xảy ra khi tạo session");
        toast.error("Có lỗi xảy ra khi tạo session");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Play className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <StopCircle className="h-4 w-4" />;
      case "cancelled":
        return <Pause className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản Lý Session
          </h1>
          <p className="text-gray-600">
            Quản lý các phiên phỏng vấn trong hệ thống
          </p>
        </div>

        {/* Create Session Button */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? "Đóng Form" : "Tạo Session Mới"}
          </Button>
        </div>

        {/* Create Session Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Tạo Session Mới
              </CardTitle>
              <CardDescription>
                Điền thông tin để tạo một phiên phỏng vấn mới
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question ID *
                    </label>
                    <Input
                      name="questionId"
                      value={formData.questionId}
                      onChange={handleInputChange}
                      placeholder="Nhập Question ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <Input
                      name="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Nhập tiêu đề session"
                      required
                    />
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm">{error}</div>}

                {isSuccess && (
                  <div className="text-green-600 text-sm">
                    Tạo session thành công!
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Đang tạo..." : "Tạo Session"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Danh Sách Session ({sessions.length})
            </CardTitle>
            <CardDescription>
              Quản lý tất cả các phiên phỏng vấn
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">
                  Đang tải danh sách session...
                </span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có session nào
                </h3>
                <p className="text-gray-500 mb-4">
                  Chưa có phiên phỏng vấn nào trong hệ thống
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {session.title}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              session.status
                            )}`}
                          >
                            {getStatusIcon(session.status)}
                            {session.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>Creator: {session.creatorId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Start:{" "}
                              {new Date(session.startTime).toLocaleString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Question ID: {session.questionId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Session ID: {session.id}</span>
                          </div>
                        </div>

                        {session.link && (
                          <div className="mt-3">
                            <a
                              href={`/dashboard/session/${session.link}?questionId=${session.questionId}&sessionId=${session.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Mở Session Link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {sessions.length} trong tổng số {totalElements}{" "}
                  session
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSessions(currentPage - 1, pageSize)}
                    disabled={currentPage === 0}
                  >
                    Trước
                  </Button>
                  <span className="text-sm text-gray-600">
                    Trang {currentPage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSessions(currentPage + 1, pageSize)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
