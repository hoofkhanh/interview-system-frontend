let wsClient: WebSocket | null = null;

export const initCodeWebSocket = (
  sessionId: string | "",
  onCodeUpdate: (code: string) => void,
  setLanguage: (newLanguage: string) => void
) => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const url = `${protocol}://localhost:9006/ws?sessionId=${sessionId}`;
  console.log(url);

  wsClient = new WebSocket(url);

  wsClient.onopen = () => console.log("WebSocket connected");

  wsClient.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "fullCode" || data.type === "codeUpdate") {
        const code: string = data.code;

        // Tự động nhận language từ comment đầu tiên: hỗ trợ // và # (Python)
        const languageMatch = code.match(/^\s*(?:\/\/|#)\s*LANGUAGE:\s*([^\s]+)/im);

        if (languageMatch) {
          const langFromCode = languageMatch[1].toLowerCase();
          console.log(languageMatch);

          switch (langFromCode) {
            case "javascript":
              setLanguage("javascript");
              break;
            case "python":
              setLanguage("python");
              break;
            case "java":
              setLanguage("java");
              break;
            case "c++":
            case "cpp":
              setLanguage("cpp");
              break;
            case "c#":
            case "csharp":
              setLanguage("csharp");
              break;
            default:
              // giữ nguyên language hiện tại
              break;
          }
        }

        // Cập nhật code editor
        onCodeUpdate(code);
      }
    } catch (err) {
      console.error("WS parse error:", err);
    }
  };

  wsClient.onclose = () => console.log("WebSocket disconnected");
  wsClient.onerror = (err) => console.error("WebSocket error:", err);

  return wsClient;
};

export const sendCodeUpdate = (code: string, sessionId: any) => {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(
      JSON.stringify({
        sessionId: sessionId,
        type: "codeUpdate",
        content: code,
      })
    );
  }
};

export const closeCodeWebSocket = () => {
  if (wsClient) wsClient.close();
  wsClient = null;
};
