"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, CheckCircle } from 'lucide-react';
import { Question, QuestionFormData, CreateQuestionFormProps } from '@/types';

export default function CreateQuestionForm({
  formData,
  isSubmitting,
  isSuccess,
  editingQuestion,
  error,
  onInputChange,
  onSubmit,
  onReset
}: CreateQuestionFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Tạo Câu Hỏi Mới'}
        </CardTitle>
        <CardDescription>
          {editingQuestion ? 'Chỉnh sửa thông tin câu hỏi' : 'Điền thông tin chi tiết cho câu hỏi mới'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề câu hỏi *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Nhập tiêu đề câu hỏi..."
              value={formData.title}
              onChange={onInputChange}
              disabled={isSubmitting}
              className={`w-full ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              required
            />
            {error && (
              <p className="text-red-600 text-sm mt-1">
                Tiêu đề câu hỏi đã tồn tại. Vui lòng chọn tiêu đề khác.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Nhập mô tả chi tiết cho câu hỏi..."
              value={formData.description}
              onChange={onInputChange}
              disabled={isSubmitting}
              className="w-full min-h-[120px]"
              required
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {editingQuestion ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {editingQuestion ? 'Đã cập nhật thành công!' : 'Đã tạo thành công!'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingQuestion ? 'Cập Nhật Câu Hỏi' : 'Tạo Câu Hỏi'}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
