import { apiClient } from '@/lib/api/client';

export const payslipApi = {
  async getMyPayslips() {
    try {
      const res = await apiClient.get('/payroll/payslips/my');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getAllPayslips() {
    try {
      const res = await apiClient.get('/payroll/payslips');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getPayslipById(id) {
    const res = await apiClient.get(`/payroll/payslips/${id}`);
    return res.data;
  },
};
