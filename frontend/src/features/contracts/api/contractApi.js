import { apiClient } from '../../../lib/api/client';

export const contractApi = {
  async getContracts(params = {}) {
    try {
      const query = {};
      if (params.status && params.status !== 'ALL') query.status = params.status;
      const res = await apiClient.get('/contracts', { params: query });
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

  async getContractsByEmployeeId(employeeId) {
    try {
      const res = await apiClient.get(`/contracts/employee/${employeeId}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async createContract(data) {
    const res = await apiClient.post('/contracts', data);
    return res.data;
  },

  async updateContract(id, data, options = {}) {
    const params = {};
    if (options.preserveHistory || data.preserveHistory) {
      params.preserveHistory = true;
    }
    const res = await apiClient.put(`/contracts/${id}`, data, { params });
    return res.data;
  },

  async updateContractStatus(id, status) {
    const res = await apiClient.patch(`/contracts/${id}/status?status=${status}`);
    return res.data;
  },

  async calculateSalaryPreview(data) {
    const res = await apiClient.post('/payroll/salary-preview', data);
    return res.data;
  },
};
