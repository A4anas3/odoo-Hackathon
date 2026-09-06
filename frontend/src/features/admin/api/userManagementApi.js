import { apiClient } from '../../../lib/api/client';

export const userManagementApi = {
  /**
   * Fetches user accounts with optional query filters (search, role, status)
   */
  async listUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);

    const url = `/admin/users${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Fetches single user record by ID
   */
  async getUser(id) {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Admin creates a user account linked to an employee with assigned roles
   */
  async createUser(payload) {
    const response = await apiClient.post('/admin/users', payload);
    return response.data;
  },

  /**
   * Admin updates user account, roles, or status
   */
  async updateUser(id, payload) {
    const response = await apiClient.put(`/admin/users/${id}`, payload);
    return response.data;
  }
};
