import { apiClient } from '../../../lib/api/client';

export const departmentApi = {
  async getAllDepartments() {
    const res = await apiClient.get('/departments');
    return res.data;
  },

  async getDepartmentById(id) {
    const res = await apiClient.get(`/departments/${id}`);
    return res.data;
  },

  async createDepartment(data) {
    const res = await apiClient.post('/departments', data);
    return res.data;
  },
};
