import { AUTH_STORAGE_KEY } from '../../config/api';

/**
 * Attaches request and response interceptors to an Axios instance.
 */
export function attachInterceptors(axiosInstance) {
  // Request Interceptor: Attach Bearer JWT
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(AUTH_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor: Normalize Errors & Handle 401
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const data = error.response?.data;
      let message = data?.message || error.message || 'An unexpected error occurred';
      if (Array.isArray(data?.details) && data.details.length > 0) {
        message = data.details.join('. ');
      }

      if (status === 401) {
        // Session expired or invalid token
        console.warn('[API Interceptor] 401 Unauthorized - clearing token');
        localStorage.removeItem(AUTH_STORAGE_KEY);
        // Dispatch custom event so app can redirect cleanly without full page refresh loop
        window.dispatchEvent(new CustomEvent('hrms:auth-expired'));
      }

      // Normalized error object
      const normalizedError = new Error(message);
      normalizedError.status = status;
      normalizedError.data = error.response?.data;
      normalizedError.originalError = error;

      return Promise.reject(normalizedError);
    }
  );
}
