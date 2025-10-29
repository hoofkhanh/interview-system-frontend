import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

export const useApi = () => {
  const { logout } = useAuth();

  const apiCall = async (config: any) => {
    try {
      const response = await axios(config);
      return response;
    } catch (error: any) {
      // If it's a 401 error, the interceptor should handle token refresh
      // If refresh fails, the interceptor will call logout
      if (error?.response?.status === 401) {
        // The interceptor should handle this, but as a fallback
        await logout();
      }
      throw error;
    }
  };

  return { apiCall };
};
