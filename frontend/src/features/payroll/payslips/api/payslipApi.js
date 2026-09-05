import { apiClient } from '@/lib/api/client';

export const DEFAULT_PAYSLIPS = [
  {
    id: 'ps-001',
    slipNumber: 'SLIP-2026-09-001',
    employee: { id: 'e1', name: 'Sarah Connor', code: 'EMP-001', dept: 'Engineering', job: 'Senior Fullstack Engineer' },
    period: 'September 2026',
    structureName: 'Regular Full-Time',
    earnings: [
      { name: 'Basic Salary', amount: 3250 },
      { name: 'House Rent Allowance (HRA)', amount: 1625 },
      { name: 'Transport Conveyance', amount: 300 },
      { name: 'Special Allowance', amount: 1325 },
    ],
    deductions: [
      { name: 'Income Tax Withholding (10%)', amount: 650 },
      { name: 'Provident Fund (5%)', amount: 162.5 },
    ],
    grossAmount: 6500,
    deductionsAmount: 812.5,
    netAmount: 5687.5,
    status: 'PAID',
    paymentDate: '2026-09-30',
  },
  {
    id: 'ps-002',
    slipNumber: 'SLIP-2026-09-002',
    employee: { id: 'e2', name: 'Michael Scott', code: 'EMP-002', dept: 'Management', job: 'Regional Director' },
    period: 'September 2026',
    structureName: 'Executive Management',
    earnings: [
      { name: 'Basic Salary', amount: 4100 },
      { name: 'Executive Allowance', amount: 2500 },
      { name: 'Transport Conveyance', amount: 500 },
      { name: 'HRA', amount: 1100 },
    ],
    deductions: [
      { name: 'Income Tax Withholding', amount: 820 },
      { name: 'Provident Fund', amount: 205 },
    ],
    grossAmount: 8200,
    deductionsAmount: 1025,
    netAmount: 7175,
    status: 'PAID',
    paymentDate: '2026-09-30',
  },
  {
    id: 'ps-003',
    slipNumber: 'SLIP-2026-09-003',
    employee: { id: 'e3', name: 'Dwight Schrute', code: 'EMP-003', dept: 'Sales', job: 'Senior Account Executive' },
    period: 'September 2026',
    structureName: 'Sales Commission Base',
    earnings: [
      { name: 'Basic Salary', amount: 2700 },
      { name: 'Sales Commission', amount: 1900 },
      { name: 'HRA', amount: 800 },
    ],
    deductions: [
      { name: 'Income Tax Withholding', amount: 540 },
      { name: 'Provident Fund', amount: 135 },
    ],
    grossAmount: 5400,
    deductionsAmount: 675,
    netAmount: 4725,
    status: 'PAID',
    paymentDate: '2026-09-30',
  },
];

export const payslipApi = {
  async getMyPayslips() {
    try {
      const res = await apiClient.get('/payroll/payslips/my');
      if (Array.isArray(res.data)) return res.data;
      return [];
    } catch {
      return [];
    }
  },

  async getPayslipById(id) {
    const res = await apiClient.get(`/payroll/payslips/${id}`);
    return res.data;
  },
};
