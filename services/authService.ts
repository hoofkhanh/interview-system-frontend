import axios from "axios";

// Utility function để redirect về login và clear tất cả auth data
export const redirectToLogin = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('username');
  localStorage.removeItem('refreshToken');
  window.dispatchEvent(new CustomEvent('authStateChanged'));

  // Sử dụng window.location.href để redirect (hoạt động ở mọi nơi)
  window.location.href = '/login';
};

// Hàm này chỉ refresh token, trả về accessToken mới hoặc null
export const fetchNewAccessToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_AUTH_ENDPOINT || 'http://localhost:9004/interview-system-auth-service/graphql',
      {
        query: `
          mutation RefreshToken($refreshToken: String!) {
            refreshToken(refreshToken: $refreshToken) {
              metadata { success message }
              status
              payload { accessToken }
            }
          }
        `,
        variables: { refreshToken }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );
    const refreshData = response.data?.data?.refreshToken;
    if (
      refreshData?.status === 'REFRESH_TOKEN_INVALID' ||
      refreshData?.status === 'REFRESH_TOKEN_EXPIRED' ||
      refreshData?.metadata?.success === false ||
      !refreshData?.payload?.accessToken
    ) {
      return null;
    }
    return refreshData.payload.accessToken;
  } catch (error) {
    // Kiểm tra sâu hơn với dạng response GraphQL trả về phía BE
    const status = axios.isAxiosError(error) && error.response?.status;
    let errorData = axios.isAxiosError(error) ? error.response?.data : undefined;
    let isRefreshTokenInvalidGraphQL = false;
    if (errorData) {
      try {
        const maybe = errorData.data?.refreshToken;
        if (
          maybe?.status === 'REFRESH_TOKEN_INVALID' ||
          maybe?.status === 'REFRESH_TOKEN_EXPIRED' ||
          maybe?.metadata?.success === false ||
          !maybe?.payload?.accessToken
        ) {
          isRefreshTokenInvalidGraphQL = true;
        }
      } catch (_) { }
    }
    if (status === 401 || isRefreshTokenInvalidGraphQL) {
      return null;
    }
    throw error;
  }
};

