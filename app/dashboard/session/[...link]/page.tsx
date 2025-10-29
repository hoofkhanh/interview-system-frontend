"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Play,
  RotateCcw,
  Save,
  Code,
  Clock,
  Settings,
  Maximize2,
  Minimize2,
} from "lucide-react";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";
import { useQuestionDetail } from "@/hooks/useQuestionDetail";
import axios from "axios";
import { fetchNewAccessToken, redirectToLogin } from "@/services/authService";
import {
  closeCodeWebSocket,
  initCodeWebSocket,
  sendCodeUpdate,
} from "@/services/codeWebSocketService";

export default function SessionCodingPage() {
  const router = useRouter();
  // Get session ID and question ID from URL parameters
  const getSessionIdFromUrl = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("sessionId");
      return sessionId;
    }
    return null;
  };

  const getQuestionIdFromUrl = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const questionId = urlParams.get("questionId");
      return questionId;
    }
    return null;
  };

  const sessionId = getSessionIdFromUrl();
  const questionId = getQuestionIdFromUrl();

  // Test with hardcoded question ID if needed
  const testQuestionId = questionId || "8041ee78-f230-40c6-984e-3e5b5e7cb6e1";

  const {
    question,
    testCases,
    loading: questionLoading,
    error: questionError,
  } = useQuestionDetail(testQuestionId);

  // Session data state
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionMembers, setSessionMembers] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [canAccessSession, setCanAccessSession] = useState(false);
  const [showRolePrompt, setShowRolePrompt] = useState(false);

  // Language templates
  const languageTemplates = {
    javascript: `// LANGUAGE: JavaScript

    // Nhập code của bạn ở đây
    function solution(n) {
        // Viết code giải quyết bài toán
        return n * n;
    }
    
    // ------------------
    // NƠI KHÔNG SỬA: Input/Output
    // ------------------
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,     // FIXED
        output: process.stdout    // FIXED
    });
    
    rl.on('line', (input) => {
        const n = parseInt(input); // FIXED
        const result = solution(n);
        console.log(result);       // FIXED
        rl.close();
    });`,

    python: `# LANGUAGE: Python
    
    # Nhập code của bạn ở đây
    def solution(n):
        # Viết code giải quyết bài toán
        return n * n
    
    # ------------------
    # NƠI KHÔNG SỬA: Input/Output
    # ------------------
    
    if __name__ == '__main__':
        import sys                  # FIXED
        n = int(input().strip())     # FIXED
        result = solution(n)
        print(result)                # FIXED`,

    java: `// LANGUAGE: Java
    
    // Nhập code của bạn ở đây
    public class Solution {
        public int solution(int n) {
            // Viết code giải quyết bài toán
            return n * n;
        }
    }
    
    // ------------------
    // NƠI KHÔNG SỬA: Input/Output
    // ------------------
    
    import java.util.Scanner;          // FIXED
    
    public class Main {
        public static void main(String[] args) {
            Scanner sc = new Scanner(System.in); // FIXED
            int n = sc.nextInt();                // FIXED
            Solution sol = new Solution();
            int result = sol.solution(n);
            System.out.println(result);          // FIXED
            sc.close();                          // FIXED
        }
    }`,

    cpp: `// LANGUAGE: C++
    
    // Nhập code của bạn ở đây
    #include <iostream>
    using namespace std;
    
    int solution(int n) {
        // Viết code giải quyết bài toán
        return n * n;
    }
    
    // ------------------
    // NƠI KHÔNG SỬA: Input/Output
    // ------------------
    
    int main() {
        int n;
        cin >> n;                 // FIXED
        int result = solution(n);
        cout << result << endl;   // FIXED
        return 0;
    }`,

    csharp: `// LANGUAGE: C#
    
    // Nhập code của bạn ở đây
    using System;
    
    public class Solution {
        public int solve(int n) {
            // Viết code giải quyết bài toán
            return n * n;
        }
    }
    
    // ------------------
    // NƠI KHÔNG SỬA: Input/Output
    // ------------------
    
    public class Program {
        public static void Main() {
            int n = int.Parse(Console.ReadLine()); // FIXED
            Solution sol = new Solution();
            int result = sol.solve(n);
            Console.WriteLine(result);             // FIXED
        }
    }`,
  };

  const [code, setCode] = useState(languageTemplates.javascript);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<any>(null);

  // Run code with third-party judge API (Judge0)
  const runCode = async () => {
    if (!code.trim()) {
      toast.error("Vui lòng nhập code");
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      // Language mapping cho Piston
      const languageMap: { [key: string]: string } = {
        javascript: "javascript",
        python: "python",
        java: "java",
        cpp: "cpp",
        csharp: "csharp",
      };

      const pistonLanguage = languageMap[language] || "javascript";

      // Lấy test case để chạy - chạy TẤT CẢ test case (cả hidden và non-hidden)
      const testCasesToRun = testCases || [];
      if (testCasesToRun.length === 0) {
        toast.error("Không có test case nào để chạy");
        return;
      }

      const results: any[] = [];

      for (let i = 0; i < testCasesToRun.length; i++) {
        const testCase = testCasesToRun[i];

        // Gửi code tới public Piston API
        const response = await axios.post(
          "https://emkc.org/api/v2/piston/execute",
          {
            language: pistonLanguage,
            version: "*", // luôn lấy version mới nhất
            files: [
              {
                name: `main.${pistonLanguage === "cpp"
                  ? "cpp"
                  : pistonLanguage === "csharp"
                    ? "cs"
                    : pistonLanguage
                  }`,
                content: code,
              },
            ],
            stdin: testCase.input || "",
          },
          { headers: { "Content-Type": "application/json" } }
        );

        console.log(response);

        const run = response.data.run;

        // Normalize outputs: ensure they end with newline for consistent comparison
        const normalizeOutput = (output: string) => {
          if (!output) return "";
          const trimmed = output.trim();
          return trimmed.endsWith("\n") ? trimmed : trimmed + "\n";
        };

        const actualOutput = normalizeOutput(run.stdout || "");
        const expectedOutput = normalizeOutput(testCase.output || "");
        const passed = actualOutput === expectedOutput;

        results.push({
          testCase: i + 1,
          input: testCase.input,
          expectedOutput,
          actualOutput,
          passed,
          isHidden: false,
          executionTime: run.time || 0,
          memoryUsed: run.memory || 0,
          errorMessage: run.stderr || null,
        });

        // Chặn request >5 req/s (200ms mỗi request)
        if (i < testCasesToRun.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      setTestResults(results);

      // Show summary
      const passedCount = results.filter((r) => r.passed).length;
      const totalCount = results.length;

      if (passedCount === totalCount) {
        toast.success(`Tất cả ${totalCount} test cases đã PASS! 🎉`);
      } else {
        toast.error(`${passedCount}/${totalCount} test cases PASS`);
      }
    } catch (error) {
      console.error("Error executing code:", error);
      toast.error("Có lỗi khi chạy code");
    } finally {
      setIsRunning(false);
    }
  };

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure editor
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 1.5,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setShowRolePrompt(true);
      return;
    }

    joinSession();

    if (sessionId && token) {
      const ws = initCodeWebSocket(
        sessionId,
        (newCode) => {
          setCode(newCode);
        },
        (lang) => {
          setLanguage(lang);
        }
      );

      return () => {
        closeCodeWebSocket();
      };
    }
  }, [sessionId]);

  // Format code
  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
      toast.success("Code đã được format");
    }
  };

  const joinSession = async () => {
    console.log("sessionId", sessionId);
    if (!sessionId) {
      toast.error("Session ID không hợp lệ");
      return;
    }
    try {
      setSessionLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setShowRolePrompt(true);
        return;
      }

      const response = await axios.post(
        process.env.NEXT_PUBLIC_SESSION_ENDPOINT ||
        "http://localhost:9004/interview-system-session-service/graphql",
        {
          query: `
            mutation JoinSession($input: JoinSessionInput!) {
              joinSession(input: $input) {
                status
                metadata { success message }
                payload {
                  members { userId fullName roleName }
                  baseSession { id creatorId questionId link startTime status title }
                }
              }
            }
          `,
          variables: { input: { sessionId } },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      const result = response.data?.data?.joinSession;

      if (result?.metadata?.success) {
        setSessionData(result.payload.baseSession);
        setSessionMembers(result.payload.members || []);
        setCanAccessSession(true);
        setSessionError(null);
        setSessionLoading(false);
        toast.success("Đã tham gia session thành công!");
      } else {
        // Nếu lỗi quyền/TOKEN, gọi refresh
        if (
          result?.status === "UNAUTHORIZED" ||
          result?.status === "TOKEN_EXPIRED"
        ) {
          await handleRefreshTokenAndRetry();
          return;
        }
        let displayMessage =
          result?.metadata?.message || "Có lỗi xảy ra khi tham gia session";
        switch (result?.status) {
          case "SESSION_NOT_FOUND":
            displayMessage = "Không tìm thấy session này";
            break;
          case "SESSION_PENDING":
            displayMessage =
              "Session chưa bắt đầu. Vui lòng đợi đến giờ bắt đầu";
            break;
          case "SESSION_ENDED":
            displayMessage = "Session đã kết thúc. Không thể tham gia";
            break;
        }
        setSessionError(displayMessage);
        setCanAccessSession(false);
        setSessionLoading(false);
        toast.error(displayMessage);
      }
    } catch (error) {
      // Catch 401: refresh token and retry
      const refreshToken = localStorage.getItem("refreshToken");
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        refreshToken
      ) {
        await handleRefreshTokenAndRetry();
        return;
      }
      setSessionError("Có lỗi khi tham gia session");
      setCanAccessSession(false);
      setSessionLoading(false);
      toast.error("Có lỗi khi tham gia session");
    } finally {
      setSessionLoading(false);
    }
  };

  // helper refresh token giống các nơi khác
  const handleRefreshTokenAndRetry = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      redirectToLogin();
      return;
    }
    const newAccessToken = await fetchNewAccessToken(refreshToken);
    if (!newAccessToken) {
      redirectToLogin();
      return;
    }
    localStorage.setItem("accessToken", newAccessToken);
    // Retry join with new token
    await joinSession();
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(languageTemplates[newLanguage as keyof typeof languageTemplates]);
    sendCodeUpdate(
      languageTemplates[newLanguage as keyof typeof languageTemplates],
      sessionId
    );
    toast.success(`Đã chuyển sang ${newLanguage}`);
  };

  // Show error screen if session access is denied
  if (showRolePrompt) {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "/dashboard";
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 space-y-4 text-center">
          <h2 className="text-xl font-semibold">Bạn là ai?</h2>
          <p className="text-gray-600">Vui lòng chọn vai trò để tiếp tục</p>
          <div className="grid grid-cols-1 gap-3">
            <Button onClick={() => router.push(`/signup-candidate?redirect=${encodeURIComponent(currentUrl)}`)}>Tôi là Ứng viên</Button>
            <Button variant="outline" onClick={() => router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)}>
              Tôi là Interviewer (đăng nhập)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionLoading && !canAccessSession && sessionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Không thể truy cập session
            </h2>
            <p className="text-gray-600 mb-6">{sessionError}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while joining session
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Đang tham gia session...
          </h2>
          <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {sessionData ? sessionData.title : "Session Coding"}
            </h1>
            <p className="text-gray-600">
              {sessionData
                ? `Session ID: ${sessionData.id}`
                : "Môi trường lập trình"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Thời gian: 60:00</span>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${sessionData?.status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
                }`}
            >
              {sessionData?.status || "LOADING"}
            </div>
            {sessionMembers.length > 0 && (
              <div className="text-sm text-gray-600">
                Thành viên: {sessionMembers.length}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`max-w-7xl mx-auto px-6 py-6 ${isFullscreen ? "fixed inset-0 z-50 bg-gray-50" : ""
          }`}
      >
        <div
          className={`grid gap-6 ${isFullscreen ? "grid-cols-1 h-full" : "grid-cols-1 lg:grid-cols-2"
            }`}
        >
          {/* Question Panel */}
          {!isFullscreen && (
            <div className="space-y-6">
              {/* Question Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Câu Hỏi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {questionLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-600">
                        Đang tải câu hỏi...
                      </span>
                    </div>
                  ) : questionError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600">Lỗi: {questionError}</p>
                      <p className="text-gray-500">
                        Không thể tải chi tiết câu hỏi
                      </p>
                    </div>
                  ) : question ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {question.title}
                        </h3>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {question.description}
                        </p>
                      </div>

                      {testCases && testCases.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Test Cases:</h4>
                          <div className="space-y-2">
                            {testCases
                              .filter((testCase) => !testCase.isHidden) // Only show non-hidden test cases
                              .map((testCase, index) => (
                                <div
                                  key={testCase.id}
                                  className="border rounded p-3 bg-gray-50"
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">
                                      Test Case {index + 1}
                                    </span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Visible
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <p>
                                      <strong>Input:</strong>{" "}
                                      <code className="bg-gray-200 px-1 rounded">
                                        {testCase.input}
                                      </code>
                                    </p>
                                    <p>
                                      <strong>Expected Output:</strong>{" "}
                                      <code className="bg-gray-200 px-1 rounded">
                                        {testCase.output}
                                      </code>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            {testCases.filter((testCase) => !testCase.isHidden)
                              .length === 0 && (
                                <div className="text-center py-4 text-gray-500">
                                  <p>Không có test case công khai nào</p>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Không có câu hỏi nào</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session Members Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Thành Viên Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sessionLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-600">
                        Đang tải thành viên...
                      </span>
                    </div>
                  ) : sessionMembers && sessionMembers.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 mb-3">
                        Tổng số thành viên:{" "}
                        <span className="font-semibold">
                          {sessionMembers.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {sessionMembers.map((member, index) => (
                          <div
                            key={member.userId || index}
                            className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {member.fullName
                                    ? member.fullName.charAt(0).toUpperCase()
                                    : "U"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.fullName || "Unknown User"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ID: {member.userId}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${member.roleName === "INTERVIEWER"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                                  }`}
                              >
                                {member.roleName || "PARTICIPANT"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>Chưa có thành viên nào trong session</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Coding Panel */}
          <div
            className={`space-y-6 ${isFullscreen ? "h-full flex flex-col" : ""
              }`}
          >
            {/* Code Editor */}
            <Card className={`${isFullscreen ? "flex-1 flex flex-col" : ""}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Code Editor
                    </CardTitle>
                    <CardDescription>
                      Viết code giải quyết bài toán
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="csharp">C#</option>
                    </select>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="vs-dark">Dark</option>
                      <option value="vs-light">Light</option>
                      <option value="hc-black">High Contrast</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={formatCode}>
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className={`${isFullscreen ? "flex-1 flex flex-col" : ""}`}
              >
                <div
                  className={`space-y-4 ${isFullscreen ? "flex-1 flex flex-col" : ""
                    }`}
                >
                  <div
                    className={`border rounded ${isFullscreen ? "flex-1" : "h-[400px]"
                      }`}
                  >
                    <Editor
                      height={isFullscreen ? "100%" : "400px"}
                      language={language}
                      theme={theme}
                      value={code}
                      onChange={(value) => {
                        const newCode = value || "";
                        setCode(newCode); // cập nhật local state
                        sendCodeUpdate(newCode, sessionId); // gửi code mới lên server qua WebSocket
                      }}
                      onMount={handleEditorDidMount}
                      options={{
                        fontSize: 14,
                        lineHeight: 1.5,
                        minimap: { enabled: true },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: "on",
                        tabSize: 2,
                        insertSpaces: true,
                        renderWhitespace: "selection",
                        bracketPairColorization: { enabled: true },
                        guides: {
                          bracketPairs: true,
                          indentation: true,
                        },
                        suggest: {
                          showKeywords: true,
                          showSnippets: true,
                        },
                        quickSuggestions: true,
                        parameterHints: { enabled: true },
                        hover: { enabled: true },
                        contextmenu: true,
                        mouseWheelZoom: true,
                      }}
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={runCode}
                      disabled={isRunning}
                      className="flex items-center gap-2"
                    >
                      {isRunning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isRunning ? "Đang chạy..." : "Chạy Code"}
                    </Button>
                    <div className="text-xs text-gray-500 flex items-center gap-4 ml-4">
                      <span>Ctrl+S: Lưu</span>
                      <span>Ctrl+Enter: Chạy</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Kết Quả Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Chỉ hiển thị test case FAIL */}
                    {testResults.filter((r) => !r.passed).length > 0 ? (
                      testResults.map(
                        (result, index) =>
                          !result.passed && (
                            <div
                              key={index}
                              className="border rounded p-3 bg-red-50 border-red-200"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">
                                  Test Case {result.testCase}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                    FAIL
                                  </span>
                                  {result.executionTime && (
                                    <span className="text-xs text-gray-500">
                                      {result.executionTime}s
                                    </span>
                                  )}
                                  {result.memoryUsed && (
                                    <span className="text-xs text-gray-500">
                                      {result.memoryUsed}KB
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm space-y-1">
                                <p>
                                  <strong>Input:</strong>{" "}
                                  <code className="bg-gray-200 px-1 rounded">
                                    {result.input}
                                  </code>
                                </p>
                                <p>
                                  <strong>Expected:</strong>{" "}
                                  <code className="bg-gray-200 px-1 rounded">
                                    {result.expectedOutput}
                                  </code>
                                </p>
                                <p>
                                  <strong>Actual:</strong>{" "}
                                  <code className="bg-gray-200 px-1 rounded">
                                    {result.actualOutput}
                                  </code>
                                </p>
                                {result.errorMessage && (
                                  <p className="text-red-600">
                                    <strong>Error:</strong>{" "}
                                    {result.errorMessage}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                      )
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-green-600 font-semibold">
                          ✅ Tất cả test cases đã PASS!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
