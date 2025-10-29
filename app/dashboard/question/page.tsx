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
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Code,
  List,
  Eye,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { fetchNewAccessToken, redirectToLogin } from "@/services/authService";
import CreateQuestionForm from "@/components/ui/create-question-form";
import TestCaseForm from "@/components/ui/test-case-form";
import QuestionDetail from "@/components/QuestionDetail";
import {
  Question,
  TestCase,
  QuestionFormData,
  QuestionsResponse,
} from "@/types";

export default function QuestionManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTab, setActiveTab] = useState<
    "questions" | "testcases" | "details"
  >("questions");
  const [viewingQuestionId, setViewingQuestionId] = useState<string | null>(
    null
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formData, setFormData] = useState<QuestionFormData>({
    title: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions from API
  const fetchQuestions = async (page: number = 0, keyword: string = "") => {
    try {
      console.log("fetchQuestions", page, keyword);
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        toast.error("Vui lòng đăng nhập lại");
        redirectToLogin();
        return;
      }

      const response = await axios.post(
        process.env.NEXT_PUBLIC_QUESTION_ENDPOINT ||
          "http://localhost:9004/interview-system-question-service/graphql",
        {
          query: `
            query Questions($input: QuestionsInput!) {
              questions(input: $input) {
                metadata {
                  success
                  message
                }
                status
                payload {
                  basePage {
                    size
                    page
                    totalElements
                    totalPages
                  }
                  baseQuestions {
                    id
                    creatorId
                    title
                    description
                    createdAt
                  }
                }
              }
            }
          `,
          variables: {
            input: {
              basePage: {
                page: page,
                size: pageSize,
              },
              keyword: keyword,
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

      const result = response.data?.data?.questions;

      if (result?.metadata?.success) {
        setQuestions(result.payload.baseQuestions || []);
        setTotalElements(result.payload.basePage.totalElements);
        setTotalPages(result.payload.basePage.totalPages);
        setCurrentPage(result.payload.basePage.page);
      } else {
        toast.error(
          result?.metadata?.message || "Có lỗi xảy ra khi tải danh sách câu hỏi"
        );
      }
    } catch (error) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        redirectToLogin();
        return;
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const newAccessToken = await fetchNewAccessToken(refreshToken);

        if (!newAccessToken) {
          redirectToLogin();
          return;
        }

        localStorage.setItem("accessToken", newAccessToken);

        // Retry with new token
        const retryResponse = await axios.post(
          process.env.NEXT_PUBLIC_QUESTION_ENDPOINT ||
            "http://localhost:9004/interview-system-question-service/graphql",
          {
            query: `
              query Questions($input: QuestionsInput!) {
                questions(input: $input) {
                  metadata {
                    success
                    message
                  }
                  status
                  payload {
                    basePage {
                      size
                      page
                      totalElements
                      totalPages
                    }
                    baseQuestions {
                      id
                      creatorId
                      title
                      description
                      createdAt
                    }
                  }
                }
              }
            `,
            variables: {
              input: {
                basePage: {
                  page: page,
                  size: pageSize,
                },
                keyword: keyword,
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

        const retryResult = retryResponse.data?.data?.questions;
        if (retryResult?.metadata?.success) {
          setQuestions(retryResult.payload.baseQuestions || []);
          setTotalElements(retryResult.payload.basePage.totalElements);
          setTotalPages(retryResult.payload.basePage.totalPages);
          setCurrentPage(retryResult.payload.basePage.page);
        }
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách câu hỏi");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load questions on component mount
  useEffect(() => {
    fetchQuestions(0, searchTerm);
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "questions") {
        fetchQuestions(0, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, activeTab]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);
    setError(null);

    const isUpdate = !!editingQuestion;

    if (isUpdate) {
      // Update existing question - use fake data for now
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id
            ? {
                ...q,
                title: formData.title.trim(),
                description: formData.description.trim(),
              }
            : q
        )
      );
      toast.success("Cập nhật câu hỏi thành công!");
      setIsSuccess(true);
      resetForm();
      setTimeout(() => setIsSuccess(false), 3000);
      setIsSubmitting(false);
    } else {
      // Create new question - use API
      try {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          toast.error("Vui lòng đăng nhập lại");
          redirectToLogin();
          return;
        }

        const response = await axios.post(
          process.env.NEXT_PUBLIC_QUESTION_ENDPOINT ||
            "http://localhost:9004/interview-system-question-service/graphql",
          {
            query: `
            mutation CreateQuestion($input: CreateQuestionInput!) {
              createQuestion(input: $input) {
                metadata {
                  success
                  message
                }
                status
                payload {
                  baseQuestion {
                    id
                    creatorId
                    title
                    description
                    createdAt
                  }
                }
              }
            }
          `,
            variables: {
              input: {
                baseQuestion: {
                  title: formData.title.trim(),
                  description: formData.description.trim(),
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

        const result = response.data?.data?.createQuestion;

        if (result?.metadata?.success) {
          toast.success("Tạo câu hỏi thành công!");
          setIsSuccess(true);
          resetForm();

          // Refresh questions list
          await fetchQuestions(currentPage, searchTerm);

          // Reset success state after 3 seconds
          setTimeout(() => setIsSuccess(false), 3000);
        } else {
          // Handle specific error cases
          const errorMessage =
            result?.metadata?.message || "Có lỗi xảy ra khi tạo câu hỏi";

          // Check if it's a title duplication error
          if (
            errorMessage.includes("Title duplicated") ||
            errorMessage.includes("duplicated")
          ) {
            setError("Tiêu đề câu hỏi đã tồn tại. Vui lòng chọn tiêu đề khác.");
          } else {
            setError(errorMessage);
          }

          toast.error(errorMessage);
        }
      } catch (error) {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          redirectToLogin();
          return;
        }

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          const newAccessToken = await fetchNewAccessToken(refreshToken);

          if (!newAccessToken) {
            redirectToLogin();
            return;
          }

          localStorage.setItem("accessToken", newAccessToken);

          // Retry with refreshed accessToken
          const retryResponse = await axios.post(
            process.env.NEXT_PUBLIC_QUESTION_ENDPOINT ||
              "http://localhost:9004/interview-system-question-service/graphql",
            {
              query: `
              mutation CreateQuestion($input: CreateQuestionInput!) {
                createQuestion(input: $input) {
                  metadata {
                    success
                    message
                  }
                  status
                  payload {
                    baseQuestion {
                      id
                      creatorId
                      title
                      description
                      createdAt
                    }
                  }
                }
              }
            `,
              variables: {
                input: {
                  baseQuestion: {
                    title: formData.title.trim(),
                    description: formData.description.trim(),
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

          const retryResult = retryResponse.data?.data?.createQuestion;
          if (retryResult?.metadata?.success) {
            toast.success("Tạo câu hỏi thành công!");
            setIsSuccess(true);
            resetForm();

            // Refresh questions list
            await fetchQuestions(currentPage, searchTerm);

            setTimeout(() => setIsSuccess(false), 3000);
          } else {
            // Handle specific error cases in retry
            const errorMessage =
              retryResult?.metadata?.message || "Có lỗi xảy ra khi tạo câu hỏi";

            // Check if it's a title duplication error
            if (
              errorMessage.includes("Title duplicated") ||
              errorMessage.includes("duplicated")
            ) {
              setError(
                "Tiêu đề câu hỏi đã tồn tại. Vui lòng chọn tiêu đề khác."
              );
            } else {
              setError(errorMessage);
            }

            toast.error(errorMessage);
          }
        } else {
          toast.error("Có lỗi xảy ra khi tạo câu hỏi");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle edit question
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      title: question.title,
      description: question.description,
    });
    setShowCreateForm(true);
  };

  // Handle delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const response = await axios.post(
        process.env.NEXT_PUBLIC_QUESTION_ENDPOINT ||
          "http://localhost:9004/interview-system-question-service/graphql",
        {
          query: `
            mutation DeleteQuestion($id: ID!) {
              deleteQuestion(id: $id) {
                metadata {
                  success
                  message
                }
                status
              }
            }
          `,
          variables: {
            id: questionId,
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

      const result = response.data?.data?.deleteQuestion;

      if (result?.metadata?.success) {
        toast.success("Xóa câu hỏi thành công!");
        // Refresh questions list
        await fetchQuestions(currentPage, searchTerm);
      } else {
        toast.error(
          result?.metadata?.message || "Có lỗi xảy ra khi xóa câu hỏi"
        );
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa câu hỏi");
    }
  };

  // Questions are already filtered by API, no need for local filtering
  const filteredQuestions = questions;

  // Reset form
  const resetForm = () => {
    setFormData({ title: "", description: "" });
    setEditingQuestion(null);
    setShowCreateForm(false);
    setIsSuccess(false);
    setError(null);
  };

  // Test Case Management Functions
  const handleTestCaseAdded = (testCase: TestCase) => {
    setTestCases((prev) => [testCase, ...prev]);
  };

  const handleTestCaseUpdated = (updatedTestCase: TestCase) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === updatedTestCase.id ? updatedTestCase : tc))
    );
  };

  const handleTestCaseDeleted = (testCaseId: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== testCaseId));
  };

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setActiveTab("testcases");
    // Load test cases for this question (you can implement API call here)
    // For now, using empty array
    setTestCases([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản Lý Câu Hỏi
          </h1>
          <p className="text-gray-600">
            Quản lý và tạo câu hỏi cho hệ thống phỏng vấn
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("questions")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "questions"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <List className="h-4 w-4 inline mr-2" />
                Danh Sách Câu Hỏi
              </button>
              <button
                onClick={() => setActiveTab("testcases")}
                disabled={!selectedQuestion}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "testcases"
                    ? "border-blue-500 text-blue-600"
                    : selectedQuestion
                    ? "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    : "border-transparent text-gray-300 cursor-not-allowed"
                }`}
              >
                <Code className="h-4 w-4 inline mr-2" />
                Test Cases
                {selectedQuestion && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {selectedQuestion.title.length > 20
                      ? selectedQuestion.title.substring(0, 20) + "..."
                      : selectedQuestion.title}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("details")}
                disabled={!viewingQuestionId}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600"
                    : viewingQuestionId
                    ? "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    : "border-transparent text-gray-300 cursor-not-allowed"
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                Chi Tiết Câu Hỏi
                {viewingQuestionId && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Đang xem
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "questions" && (
          <>
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm câu hỏi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {showCreateForm ? "Đóng Form" : "Tạo Câu Hỏi Mới"}
              </Button>
            </div>

            {/* Create/Edit Form */}
            {showCreateForm && (
              <CreateQuestionForm
                formData={formData}
                isSubmitting={isSubmitting}
                isSuccess={isSuccess}
                editingQuestion={editingQuestion}
                error={error}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onReset={resetForm}
              />
            )}

            {/* Questions List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Danh Sách Câu Hỏi ({filteredQuestions.length})
                </CardTitle>
                <CardDescription>
                  Quản lý tất cả câu hỏi trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">
                      Đang tải danh sách câu hỏi...
                    </span>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      {searchTerm
                        ? "Không tìm thấy câu hỏi nào phù hợp với từ khóa tìm kiếm"
                        : "Chưa có câu hỏi nào trong hệ thống"}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Tạo Câu Hỏi Đầu Tiên
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {question.title}
                            </h3>
                            <p className="text-gray-600 mb-3 line-clamp-3">
                              {question.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>ID: {question.id}</span>
                              <span>•</span>
                              <span>
                                Tạo lúc:{" "}
                                {new Date(question.createdAt).toLocaleString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setViewingQuestionId(question.id);
                                setActiveTab("details");
                              }}
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Eye className="h-4 w-4" />
                              Xem Chi Tiết
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectQuestion(question)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Code className="h-4 w-4" />
                              Test Cases
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Sửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </Button>
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
                      Hiển thị {questions.length} trong tổng số {totalElements}{" "}
                      câu hỏi
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchQuestions(currentPage - 1, searchTerm)
                        }
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
                        onClick={() =>
                          fetchQuestions(currentPage + 1, searchTerm)
                        }
                        disabled={currentPage >= totalPages - 1}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === "testcases" && selectedQuestion && (
          <TestCaseForm
            questionId={selectedQuestion.id}
            testCases={testCases}
            onTestCaseAdded={handleTestCaseAdded}
            onTestCaseUpdated={handleTestCaseUpdated}
            onTestCaseDeleted={handleTestCaseDeleted}
          />
        )}

        {activeTab === "testcases" && !selectedQuestion && (
          <Card>
            <CardContent className="text-center py-12">
              <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chọn câu hỏi để quản lý test cases
              </h3>
              <p className="text-gray-500 mb-4">
                Vui lòng chọn một câu hỏi từ danh sách để bắt đầu quản lý test
                cases
              </p>
              <Button
                onClick={() => setActiveTab("questions")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Quay lại danh sách câu hỏi
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "details" && viewingQuestionId && (
          <QuestionDetail questionId={viewingQuestionId} />
        )}

        {activeTab === "details" && !viewingQuestionId && (
          <Card>
            <CardContent className="text-center py-12">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chọn câu hỏi để xem chi tiết
              </h3>
              <p className="text-gray-500 mb-4">
                Vui lòng chọn một câu hỏi từ danh sách để xem chi tiết
              </p>
              <Button
                onClick={() => setActiveTab("questions")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Quay lại danh sách câu hỏi
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
