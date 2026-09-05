import { apiClient } from '@/lib/api/client';

export const salaryRuleApi = {
  async getAllRules(structureId) {
    const params = structureId ? { structureId } : {};
    const res = await apiClient.get('/salary/rules', { params });
    return res.data;
  },

  async getRuleById(id) {
    const res = await apiClient.get(`/salary/rules/${id}`);
    return res.data;
  },

  async createRule(data) {
    const res = await apiClient.post('/salary/rules', data);
    return res.data;
  },

  async updateRule(id, data) {
    const res = await apiClient.put(`/salary/rules/${id}`, data);
    return res.data;
  },

  async deleteRule(id) {
    await apiClient.delete(`/salary/rules/${id}`);
  },
};
