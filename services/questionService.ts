import axios from 'axios';
import { fetchNewAccessToken, redirectToLogin } from './authService';
import { QuestionDetailResponse } from '@/types';

// Question Service
export class QuestionService {
  private static readonly ENDPOINT = process.env.NEXT_PUBLIC_QUESTION_ENDPOINT || 'http://localhost:9004/interview-system-question-service/graphql';

  // Fetch question details by ID
  static async getQuestionById(questionId: string): Promise<QuestionDetailResponse> {
    const query = `
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
    `;

    const variables = {
      input: {
        id: questionId
      }
    };

    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        redirectToLogin();
        return {} as QuestionDetailResponse;
      }

      if (!accessToken) {
        redirectToLogin();
        return {} as QuestionDetailResponse;
      }


      const response = await axios.post(
        this.ENDPOINT,
        {
          query,
          variables
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          withCredentials: true
        }
      );

      return response.data;
    } catch (error) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        redirectToLogin();
        return {} as QuestionDetailResponse;
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const newAccessToken = await fetchNewAccessToken(refreshToken);

        if (!newAccessToken) {
          redirectToLogin();
          return {} as QuestionDetailResponse;
        }

        localStorage.setItem('accessToken', newAccessToken);

        // Retry with new token
        const retryResponse = await axios.post(
          this.ENDPOINT,
          {
            query,
            variables
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`
            },
            withCredentials: true
          }
        );

        return retryResponse.data;
      } else {
        throw error;
      }
    }
  }

  // Fetch questions list (existing functionality)
  static async getQuestions(page: number = 0, size: number = 10, keyword: string = '') {
    const query = `
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
    `;

    const variables = {
      input: {
        basePage: {
          page: page,
          size: size
        },
        keyword: keyword
      }
    };

    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!accessToken) {
        redirectToLogin();
        return;
      }
      if (!refreshToken) {
        redirectToLogin();
        return;
      }

      const response = await axios.post(
        this.ENDPOINT,
        {
          query,
          variables
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          withCredentials: true
        }
      );

      return response.data;
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
        const retryResponse = await axios.post(
          this.ENDPOINT,
          {
            query,
            variables
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`
            },
            withCredentials: true
          }
        );

        return retryResponse.data;
      } else {
        throw error;
      }
    }
  }
}

