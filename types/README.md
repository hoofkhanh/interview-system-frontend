# Types Directory

This directory contains all TypeScript interfaces and type definitions for the interview system project, organized by domain for better maintainability and reusability.

## Structure

### `auth.ts`
Contains authentication and user management related types:
- `User` - User data structure
- `AuthContextType` - Authentication context interface
- `AuthGuardProps` - Authentication guard component props
- `LogoutButtonProps` - Logout button component props

### `question.ts`
Contains question management related types:
- `Question` - Question data structure
- `QuestionFormData` - Question form data structure
- `QuestionsResponse` - API response structure for questions
- `CreateQuestionFormProps` - Create question form component props

### `testcase.ts`
Contains test case management related types:
- `TestCase` - Test case data structure
- `TestCaseFormData` - Test case form data structure
- `TestCaseFormProps` - Test case form component props

### `ui.ts`
Contains UI component related types:
- `FormItemContextValue` - Form item context value type

### `index.ts`
Central export file that re-exports all types from the individual files for easy importing.

## Usage

Import types from the central index file:

```typescript
import { User, Question, TestCase } from '@/types';
```

Or import from specific files:

```typescript
import { User, AuthContextType } from '@/types/auth';
import { Question, QuestionFormData } from '@/types/question';
```

## Benefits

1. **Centralized Management**: All types are in one place, making them easy to find and maintain
2. **Reusability**: Types can be easily imported and reused across different components
3. **Consistency**: Prevents duplicate type definitions and ensures consistency
4. **Organization**: Types are organized by domain, making the codebase more maintainable
5. **Type Safety**: Centralized types ensure better type safety across the application
