import { apiClient } from '@/lib/api/client';

export const payrunApi = {
  async getAllPayruns() {
    try {
      const res = await apiClient.get('/payroll/payruns');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((p) => ({
          ...p,
          name: p.name || `Payrun ${p.periodStart} – ${p.periodEnd}`,
          grossAmount: p.totalGross || p.grossAmount || 0,
          netAmount: p.totalNet || p.netAmount || 0,
          deductionsAmount: (p.totalGross || 0) - (p.totalNet || 0),
          employeeCount: p.payslipCount || p.employeeCount || 0,
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  async getPayrunById(id) {
    const res = await apiClient.get(`/payroll/payruns/${id}`);
    const p = res.data;
    return {
      ...p,
      name: p.name || `Payrun ${p.periodStart} – ${p.periodEnd}`,
      grossAmount: p.totalGross || p.grossAmount || 0,
      netAmount: p.totalNet || p.netAmount || 0,
      deductionsAmount: (p.totalGross || 0) - (p.totalNet || 0),
      employeeCount: p.payslipCount || p.employeeCount || 0,
    };
  },

  async generatePayrun(data) {
    const payload = {
      periodStart: data.startDate || data.periodStart,
      periodEnd: data.endDate || data.periodEnd,
      salaryStructureId: data.salaryStructureId,
      createdBy: 'admin@company.com',
    };
    const res = await apiClient.post('/payroll/payruns', payload);
    return res.data;
  },

  async validatePayrun(id) {
    const res = await apiClient.patch(`/payroll/payruns/${id}/validate`);
    return res.data;
  },

  async payPayrun(id) {
    const res = await apiClient.patch(`/payroll/payruns/${id}/pay`);
    return res.data;
  },
};
