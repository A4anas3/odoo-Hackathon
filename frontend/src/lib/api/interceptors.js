import axios from 'axios';
import { AUTH_STORAGE_KEY, REFRESH_STORAGE_KEY, API_BASE_URL } from '../../config/api';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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

  // Response Interceptor: Normalize Errors & Handle 401 with Silent Refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;
      const data = error.response?.data;

      // Handle 401 Unauthorized with silent refresh
      const isAuthRequest = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');
      if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
        const refreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);

        if (refreshToken) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
            localStorage.setItem(AUTH_STORAGE_KEY, accessToken);
            if (newRefreshToken) {
              localStorage.setItem(REFRESH_STORAGE_KEY, newRefreshToken);
            }

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            processQueue(null, accessToken);
            return axiosInstance(originalRequest);
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            console.warn('[API Interceptor] Token refresh failed - clearing session');
            localStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(REFRESH_STORAGE_KEY);
            window.dispatchEvent(new CustomEvent('hrms:auth-expired'));
            return Promise.reject(refreshErr);
          } finally {
            isRefreshing = false;
          }
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(REFRESH_STORAGE_KEY);
          window.dispatchEvent(new CustomEvent('hrms:auth-expired'));
        }
      }

      let message = data?.message || error.message || 'An unexpected error occurred';
      if (Array.isArray(data?.details) && data.details.length > 0) {
        message = data.details.join('. ');
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

