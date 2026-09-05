import { apiClient } from '../../../lib/api/client';

export const jobPositionApi = {
  async getAllJobPositions(departmentId) {
    const params = departmentId ? { departmentId } : {};
    const res = await apiClient.get('/job-positions', { params });
    return res.data;
  },

  async getJobPositionById(id) {
    const res = await apiClient.get(`/job-positions/${id}`);
    return res.data;
  },

  async createJobPosition(data) {
    const res = await apiClient.post('/job-positions', data);
    return res.data;
  },
};
