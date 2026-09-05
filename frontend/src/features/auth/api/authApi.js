import { authClient } from '../../../lib/api/client';

export const authApi = {
  /**
   * Logs in against peoplePay auth microservice: POST /auth/login
   */
  async login(credentials) {
    const response = await authClient.post('/login', credentials);
    return response.data;
  },

  /**
   * Registers a new user against peoplePay auth microservice: POST /auth/register
   */
  async register(data) {
    const response = await authClient.post('/register', data);
    return response.data;
  },

  async logout() {
    try {
      await authClient.post('/logout');
    } catch {
      // Silent fail on logout
    }
  },

  async getMe() {
    const response = await authClient.get('/me');
    return response.data;
  }
};
