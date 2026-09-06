import { apiClient } from '@/lib/api/client';

export const payslipApi = {
  async getMyPayslips(params = {}) {
    try {
      const query = {};
      if (params.month && params.month !== 'ALL') query.month = params.month;
      if (params.year && params.year !== 'ALL') query.year = params.year;
      if (params.search && params.search.trim()) query.search = params.search.trim();
      if (params.status && params.status !== 'ALL') query.status = params.status;
      const res = await apiClient.get('/payroll/payslips/my', { params: query });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getAllPayslips(params = {}) {
    try {
      // Build query params — only include truthy filter values
      const query = {};
      if (params.payrunId && params.payrunId !== 'ALL') query.payrunId = params.payrunId;
      if (params.department && params.department !== 'ALL') query.department = params.department;
      if (params.month && params.month !== 'ALL') query.month = params.month;
      if (params.year && params.year !== 'ALL') query.year = params.year;
      if (params.search && params.search.trim()) query.search = params.search.trim();
      if (params.status && params.status !== 'ALL') query.status = params.status;
      const res = await apiClient.get('/payroll/payslips', { params: query });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getPayslipById(id) {
    const res = await apiClient.get(`/payroll/payslips/${id}`);
    return res.data;
  },

  async computePayslip(id) {
    const res = await apiClient.post(`/payroll/payslips/${id}/compute`);
    return res.data;
  },

  async payPayslip(id) {
    const res = await apiClient.patch(`/payroll/payslips/${id}/pay`);
    return res.data;
  },

  async sendPayslipEmail(id) {
    const res = await apiClient.post(`/payroll/payslips/${id}/send-email`);
    return res.data;
  },

  async downloadPayslipPdf(id) {
    const res = await apiClient.get(`/payroll/payslips/${id}/pdf`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf, application/octet-stream, */*',
      },
    });
    return res.data;
  },
};
