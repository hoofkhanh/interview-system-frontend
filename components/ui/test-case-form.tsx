"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, CheckCircle, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { TestCase, TestCaseFormData, TestCaseFormProps } from '@/types';
import axios from 'axios';
import { fetchNewAccessToken, redirectToLogin } from '@/services/authService';

export default function TestCaseForm({
  questionId,
  testCases,
  onTestCaseAdded,
  onTestCaseUpdated,
  onTestCaseDeleted
}: TestCaseFormProps) {
  const [formData, setFormData] = useState<TestCaseFormData>({
    input: '',
    output: '',
    isHidden: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isHidden: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.input.trim() || !formData.output.trim()) {
      setError('Vui lòng điền đầy đủ input và output');
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }

      const mutation = editingTestCase ? 'UpdateTestCase' : 'CreateTestCase';
      const inputField = editingTestCase ? 'updateTestCaseInput' : 'input';
      const mutationField = editingTestCase ? 'updateTestCase' : 'createTestCase';

      const response = await axios.post(
        process.env.NEXT_PUBLIC_QUESTION_ENDPOINT || 'http://localhost:9004/interview-system-question-service/graphql',
        {
          query: `
            mutation ${mutation}($${inputField}: ${editingTestCase ? 'UpdateTestCaseInput!' : 'CreateTestCaseInput!'}) {
              ${mutationField}(${inputField}: $${inputField}) {
                metadata {
                  success
                  message
                }
                status
                payload {
                  baseTestCase {
                    id
                    input
                    output
                    isHidden
                  }
                }
              }
            }
          `,
          variables: {
            [inputField]: editingTestCase ? {
              id: editingTestCase.id,
              baseTestCase: {
                input: formData.input.trim(),
                output: formData.output.trim(),
                isHidden: formData.isHidden
              }
            } : {
              questionId: questionId,
              baseTestCase: {
                input: formData.input.trim(),
                output: formData.output.trim(),
                isHidden: formData.isHidden
              }
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          withCredentials: true
        }
      );

      const testCaseResult = response.data?.data?.[mutationField];

      if (testCaseResult?.metadata?.success) {
        const newTestCase: TestCase = {
          id: testCaseResult.payload.baseTestCase.id,
          input: testCaseResult.payload.baseTestCase.input,
          output: testCaseResult.payload.baseTestCase.output,
          isHidden: testCaseResult.payload.baseTestCase.isHidden
        };

        if (editingTestCase) {
          onTestCaseUpdated(newTestCase);
          toast.success('Cập nhật test case thành công!');
        } else {
          onTestCaseAdded(newTestCase);
          toast.success('Tạo test case thành công!');
        }

        setIsSuccess(true);
        resetForm();

        // Reset success state after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        const errorMessage = testCaseResult?.metadata?.message || 'Có lỗi xảy ra khi tạo test case';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const refreshToken = localStorage.getItem('refreshToken');
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

        localStorage.setItem('accessToken', newAccessToken);

        // Retry with new token
        const mutation = editingTestCase ? 'UpdateTestCase' : 'CreateTestCase';
        const inputField = editingTestCase ? 'updateTestCaseInput' : 'input';
        const mutationField = editingTestCase ? 'updateTestCase' : 'createTestCase';

        const retryResponse = await axios.post(
          process.env.NEXT_PUBLIC_QUESTION_ENDPOINT || 'http://localhost:9004/interview-system-question-service/graphql',
          {
            query: `
              mutation ${mutation}($${inputField}: ${editingTestCase ? 'UpdateTestCaseInput!' : 'CreateTestCaseInput!'}) {
                ${mutationField}(${inputField}: $${inputField}) {
                  metadata {
                    success
                    message
                  }
                  status
                  payload {
                    baseTestCase {
                      id
                      input
                      output
                      isHidden
                    }
                  }
                }
              }
            `,
            variables: {
              [inputField]: editingTestCase ? {
                id: editingTestCase.id,
                baseTestCase: {
                  input: formData.input.trim(),
                  output: formData.output.trim(),
                  isHidden: formData.isHidden
                }
              } : {
                questionId: questionId,
                baseTestCase: {
                  input: formData.input.trim(),
                  output: formData.output.trim(),
                  isHidden: formData.isHidden
                }
              }
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`
            },
            withCredentials: true
          }
        );

        const retryResult = retryResponse.data?.data?.[mutationField];
        if (retryResult?.metadata?.success) {
          const newTestCase: TestCase = {
            id: retryResult.payload.baseTestCase.id,
            input: retryResult.payload.baseTestCase.input,
            output: retryResult.payload.baseTestCase.output,
            isHidden: retryResult.payload.baseTestCase.isHidden
          };

          if (editingTestCase) {
            onTestCaseUpdated(newTestCase);
            toast.success('Cập nhật test case thành công!');
          } else {
            onTestCaseAdded(newTestCase);
            toast.success('Tạo test case thành công!');
          }

          setIsSuccess(true);
          resetForm();
          setTimeout(() => setIsSuccess(false), 3000);
        }
      } else {
        console.error('Error creating test case:', error);
        setError('Có lỗi xảy ra khi tạo test case');
        toast.error('Có lỗi xảy ra khi tạo test case');
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setFormData({
      input: testCase.input,
      output: testCase.output,
      isHidden: testCase.isHidden
    });
  };

  const handleDelete = async (testCaseId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa test case này?')) {
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetch(
        process.env.NEXT_PUBLIC_QUESTION_ENDPOINT || 'http://localhost:9004/interview-system-question-service/graphql',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          credentials: 'include',
          body: JSON.stringify({
            query: `
              mutation DeleteTestCase($id: ID!) {
                deleteTestCase(id: $id) {
                  metadata {
                    success
                    message
                  }
                  status
                }
              }
            `,
            variables: {
              id: testCaseId
            }
          })
        }
      );

      const result = await response.json();
      const deleteResult = result?.data?.deleteTestCase;

      if (deleteResult?.metadata?.success) {
        onTestCaseDeleted(testCaseId);
        toast.success('Xóa test case thành công!');
      } else {
        toast.error(deleteResult?.metadata?.message || 'Có lỗi xảy ra khi xóa test case');
      }
    } catch (error) {
      console.error('Error deleting test case:', error);
      toast.error('Có lỗi xảy ra khi xóa test case');
    }
  };

  const resetForm = () => {
    setFormData({ input: '', output: '', isHidden: false });
    setEditingTestCase(null);
    setIsSuccess(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingTestCase ? 'Chỉnh Sửa Test Case' : 'Thêm Test Case Mới'}
          </CardTitle>
          <CardDescription>
            {editingTestCase ? 'Chỉnh sửa thông tin test case' : 'Thêm test case mới cho câu hỏi này'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Lỗi</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="input">Input *</Label>
                <Textarea
                  id="input"
                  name="input"
                  placeholder="Nhập input cho test case..."
                  value={formData.input}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className={`min-h-[100px] ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="output">Output *</Label>
                <Textarea
                  id="output"
                  name="output"
                  placeholder="Nhập output mong đợi..."
                  value={formData.output}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className={`min-h-[100px] ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isHidden"
                checked={formData.isHidden}
                onCheckedChange={handleCheckboxChange}
                disabled={isSubmitting}
              />
              <Label htmlFor="isHidden" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Test case ẩn (không hiển thị cho ứng viên)
              </Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || !formData.input.trim() || !formData.output.trim()}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {editingTestCase ? 'Đang cập nhật...' : 'Đang tạo...'}
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {editingTestCase ? 'Đã cập nhật thành công!' : 'Đã tạo thành công!'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {editingTestCase ? 'Cập Nhật Test Case' : 'Tạo Test Case'}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>


    </div>
  );
}
