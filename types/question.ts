// Question Management Types

export interface Question {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface QuestionFormData {
  title: string;
  description: string;
}

export interface QuestionsResponse {
  data: {
    questions: {
      metadata: {
        success: boolean;
        message: string;
      };
      status: number;
      payload: {
        basePage: {
          size: number;
          page: number;
          totalElements: number;
          totalPages: number;
        };
        baseQuestions: Question[];
      };
    };
  };
}

export interface QuestionDetailResponse {
  data: {
    question: {
      metadata: {
        success: boolean;
        message: string;
      };
      status: number;
      payload: {
        baseQuestion: Question;
        testCases: Array<{
          id: string;
          input: string;
          output: string;
          isHidden: boolean;
        }>;
      };
    };
  };
}

export interface CreateQuestionFormProps {
  formData: QuestionFormData;
  isSubmitting: boolean;
  isSuccess: boolean;
  editingQuestion: Question | null;
  error: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}