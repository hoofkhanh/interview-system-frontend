# Question Detail API Usage Guide

This guide shows how to use the new question detail API with proper error handling for token expiration.

## 🚀 Quick Start

### 1. Using the React Hook (Recommended)

```typescript
import { useQuestionDetail } from '@/hooks/useQuestionDetail';

function MyComponent() {
  const { question, testCases, loading, error, refetch } = useQuestionDetail("8041ee78-f230-40c6-984e-3e5b5e7cb6e1");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!question) return <div>Question not found</div>;

  return (
    <div>
      <h1>{question.title}</h1>
      <p>{question.description}</p>
      <h2>Test Cases ({testCases.length})</h2>
      {testCases.map(testCase => (
        <div key={testCase.id}>
          <p>Input: {testCase.input}</p>
          <p>Output: {testCase.output}</p>
          {testCase.isHidden && <span>Hidden</span>}
        </div>
      ))}
    </div>
  );
}
```

### 2. Using the Service Directly

```typescript
import { QuestionService } from '@/services/questionService';

async function fetchQuestionDetails() {
  try {
    const response = await QuestionService.getQuestionById("8041ee78-f230-40c6-984e-3e5b5e7cb6e1");
    
    if (response.data?.question?.metadata?.success) {
      const question = response.data.question.payload.baseQuestion;
      const testCases = response.data.question.payload.testCases;
      
      console.log('Question:', question);
      console.log('Test Cases:', testCases);
    } else {
      console.error('API Error:', response.data?.question?.metadata?.message);
    }
  } catch (error) {
    console.error('Failed to fetch question:', error);
  }
}
```

### 3. Using the QuestionDetail Component

```typescript
import QuestionDetail from '@/components/QuestionDetail';

function MyPage() {
  const [questionId, setQuestionId] = useState<string | null>(null);

  return (
    <div>
      <button onClick={() => setQuestionId("8041ee78-f230-40c6-984e-3e5b5e7cb6e1")}>
        Load Question Details
      </button>
      
      {questionId && (
        <QuestionDetail questionId={questionId} />
      )}
    </div>
  );
}
```

## 🔧 API Details

### GraphQL Query Structure

The API uses this GraphQL query:

```graphql
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
```

### Error Handling

The API automatically handles:

1. **401 Unauthorized**: Automatically refreshes the access token using the refresh token
2. **Refresh Token Expired**: Redirects to login page
3. **Network Errors**: Proper error messages and retry functionality
4. **API Errors**: Displays user-friendly error messages

### Response Types

```typescript
interface QuestionDetailResponse {
  data: {
    question: {
      metadata: {
        success: boolean;
        message: string;
      };
      status: number;
      payload: {
        baseQuestion: Question;
        testCases: TestCase[];
      };
    };
  };
}
```

## 🎯 Integration Example

The question management page now includes a "View Details" button for each question. When clicked:

1. Sets the `viewingQuestionId` state
2. Switches to the "details" tab
3. Automatically loads and displays the question details using the `QuestionDetail` component

## 🔄 Token Refresh Flow

1. API call fails with 401
2. Automatically calls `fetchNewAccessToken()` with refresh token
3. If successful, retries original request with new access token
4. If refresh token also expired, redirects to login page
5. User sees seamless experience without manual intervention

## 📁 File Structure

```
services/
├── apiHelper.ts          # Generic API call with token refresh
├── questionService.ts     # Question-specific API methods
└── authService.ts         # Authentication utilities

hooks/
└── useQuestionDetail.ts   # React hook for question details

components/
└── QuestionDetail.tsx     # Reusable question detail component

types/
└── question.ts           # TypeScript interfaces
```

This implementation follows your existing patterns and provides a robust, reusable solution for fetching question details with proper error handling.
