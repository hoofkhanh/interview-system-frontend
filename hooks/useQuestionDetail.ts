import { useState, useEffect } from 'react';
import { QuestionService } from '@/services/questionService';
import { Question, TestCase, QuestionDetailResponse } from '@/types';
import toast from 'react-hot-toast';
import axios from 'axios';
import { fetchNewAccessToken, redirectToLogin } from '@/services/authService';

interface UseQuestionDetailReturn {
  question: Question | null;
  testCases: TestCase[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useQuestionDetail = (questionId: string | null): UseQuestionDetailReturn => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestionDetail = async () => {
    if (!questionId) {
      setQuestion(null);
      setTestCases([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }

      const response = await axios.post(
        process.env.NEXT_PUBLIC_QUESTION_ENDPOINT || 'http://localhost:9004/interview-system-question-service/graphql',
        {
          query: `
            query Question($input: QuestionInput!) {
              question(input: $input) {
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
                  testCases {
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
            input: {
              id: questionId
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

      const result = response.data?.data?.question;
      if (result?.metadata?.success) {
        setQuestion(result.payload.baseQuestion);
        setTestCases(result.payload.testCases || []);
      } else {
        const errorMessage = result?.metadata?.message || 'Có lỗi xảy ra khi tải chi tiết câu hỏi';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        redirectToLogin();
        return;
      }

      console.log('error response', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const newAccessToken = await fetchNewAccessToken(refreshToken);

        if (!newAccessToken) {
          redirectToLogin();
          return;
        }

        localStorage.setItem('accessToken', newAccessToken);

        // Retry with new token
        const retryResponse = await axios.post(
          process.env.NEXT_PUBLIC_QUESTION_ENDPOINT || 'http://localhost:9004/interview-system-question-service/graphql',
          {
            query: `
              query Question($input: QuestionInput!) {
                question(input: $input) {
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
                    testCases {
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
              input: {
                id: questionId
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

        const retryResult = retryResponse.data?.data?.question;
        if (retryResult?.metadata?.success) {
          setQuestion(retryResult.payload.baseQuestion);
          setTestCases(retryResult.payload.testCases || []);
        } else {
          const errorMessage = retryResult?.metadata?.message || 'Có lỗi xảy ra khi tải chi tiết câu hỏi';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        console.error('Error fetching question detail:', error);
        const errorMessage = 'Có lỗi xảy ra khi tải chi tiết câu hỏi';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionDetail();
  }, [questionId]);

  return {
    question,
    testCases,
    loading,
    error,
    refetch: fetchQuestionDetail
  };
};
