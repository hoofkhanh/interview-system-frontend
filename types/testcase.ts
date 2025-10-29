// Test Case Management Types

export interface TestCase {
  id: string;
  input: string;
  output: string;
  isHidden: boolean;
}

export interface TestCaseFormData {
  input: string;
  output: string;
  isHidden: boolean;
}

export interface TestCaseFormProps {
  questionId: string;
  testCases: TestCase[];
  onTestCaseAdded: (testCase: TestCase) => void;
  onTestCaseUpdated: (testCase: TestCase) => void;
  onTestCaseDeleted: (testCaseId: string) => void;
}
