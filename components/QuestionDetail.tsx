"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useQuestionDetail } from '@/hooks/useQuestionDetail';
import { Question, TestCase } from '@/types';

interface QuestionDetailProps {
  questionId: string | null;
}

export default function QuestionDetail({ questionId }: QuestionDetailProps) {
  const { question, testCases, loading, error, refetch } = useQuestionDetail(questionId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải chi tiết câu hỏi...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Thử lại
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!question) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Không tìm thấy câu hỏi</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{question.title}</CardTitle>
          <CardDescription>
            ID: {question.id} | Tạo bởi: {question.creatorId} | Ngày tạo: {new Date(question.createdAt).toLocaleDateString('vi-VN')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{question.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Test Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Test Cases ({testCases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {testCases.length === 0 ? (
            <p className="text-gray-500">Chưa có test case nào</p>
          ) : (
            <div className="space-y-4">
              {testCases.map((testCase, index) => (
                <div key={testCase.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Test Case {index + 1}</h4>
                    {testCase.isHidden && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Input:</label>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-sm overflow-x-auto">
                        {testCase.input}
                      </pre>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Expected Output:</label>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-sm overflow-x-auto">
                        {testCase.output}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
