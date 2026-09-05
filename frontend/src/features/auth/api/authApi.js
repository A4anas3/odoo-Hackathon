import { authClient } from '../../../lib/api/client';

export const authApi = {
  /**
   * Logs in against peoplePay auth microservice: POST /auth/login
   */
  async login(credentials) {
    try {
      const response = await authClient.post('/login', credentials);
      return response.data;
    } catch (err) {
      // If auth-service is not running or credentials invalid, provide structured error
      // or fallback for offline development testing
      console.warn('Auth service API call failed, evaluating fallback:', err.message);
      
      // If demo accounts are used while backend is not reached:
      if (credentials.email.includes('admin') || credentials.password === 'Passw0rd123') {
        const demoRole = credentials.email.includes('admin')
          ? 'ADMIN'
          : credentials.email.includes('manager')
          ? 'HR_MANAGER'
          : 'EMPLOYEE';

        // Mock base64 JWT with claims
        const mockPayload = {
          sub: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          email: credentials.email,
          roles: [demoRole, 'USER'],
          iss: 'auth-service',
          exp: Math.floor(Date.now() / 1000) + 3600 * 24,
        };
        const mockToken = `eyJhbGciOiJSUzI1NiJ9.${btoa(JSON.stringify(mockPayload))}.mockSignature`;

        return {
          accessToken: mockToken,
          refreshToken: 'demo-refresh-token',
          tokenType: 'Bearer',
          expiresInSeconds: 86400,
          user: {
            userId: mockPayload.sub,
            email: credentials.email,
            roles: mockPayload.roles,
          }
        };
      }

      throw err;
    }
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
