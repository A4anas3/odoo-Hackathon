import { apiClient } from '../../../lib/api/client';

export const contractApi = {
  async getContracts() {
    try {
      const res = await apiClient.get('/contracts');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getMyContracts() {
    try {
      const res = await apiClient.get('/contracts/my');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getContractById(id) {
    const res = await apiClient.get(`/contracts/${id}`);
    return res.data;
  },

  async createContract(data) {
    const res = await apiClient.post('/contracts', data);
    return res.data;
  },

  async updateContractStatus(id, status) {
    const res = await apiClient.patch(`/contracts/${id}/status?status=${status}`);
    return res.data;
  },
};
