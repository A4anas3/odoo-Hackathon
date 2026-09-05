import { apiClient } from '@/lib/api/client';

export const salaryStructureApi = {
  async getAllStructures() {
    const res = await apiClient.get('/salary/structures');
    return res.data;
  },

  async getStructureById(id) {
    const res = await apiClient.get(`/salary/structures/${id}`);
    return res.data;
  },

  async createStructure(data) {
    const res = await apiClient.post('/salary/structures', data);
    return res.data;
  },

  async updateStructure(id, data) {
    const res = await apiClient.put(`/salary/structures/${id}`, data);
    return res.data;
  },

  async deleteStructure(id) {
    const res = await apiClient.delete(`/salary/structures/${id}`);
    return res.data;
  },
};
