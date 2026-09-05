import { apiClient } from '../../../lib/api/client';

export const employeeApi = {
  async getEmployees(params = {}) {
    const response = await apiClient.get('/employees', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  async getAllEmployees(params = {}) {
    return this.getEmployees(params);
  },

  async getEmployeeById(id) {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  async getMyProfile() {
    const response = await apiClient.get('/employees/me');
    return response.data;
  },

  async createEmployee(data) {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },

  async updateEmployee(id, data) {
    const response = await apiClient.put(`/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id) {
    await apiClient.delete(`/employees/${id}`);
  },
};
