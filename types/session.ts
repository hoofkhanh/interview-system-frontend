// Session Management Types

export interface Session {
  id: string;
  creatorId: string;
  questionId: string;
  link: string;
  startTime: string;
  status: string;
  title: string;
}

export interface SessionsResponse {
  data: {
    sessions: {
      basePage: {
        size: number;
        page: number;
        totalElements: number;
        totalPages: number;
      };
      baseSessions: Session[];
    };
  };
}
