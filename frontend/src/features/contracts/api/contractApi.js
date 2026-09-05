import { apiClient } from '../../../lib/api/client';

export const DEFAULT_CONTRACTS = [
  {
    id: 'cnt-01',
    employee: { id: 'e101-uuid-001', name: 'Sarah Connor', code: 'EMP-001' },
    wage: 6500,
    wageType: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '2023-01-15',
    endDate: null,
    structureName: 'Regular Full-Time',
    scheduleName: 'Standard 40h',
  },
  {
    id: 'cnt-02',
    employee: { id: 'e102-uuid-002', name: 'Michael Scott', code: 'EMP-002' },
    wage: 8200,
    wageType: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '2021-06-01',
    endDate: null,
    structureName: 'Executive Management',
    scheduleName: 'Executive Flexible',
  },
  {
    id: 'cnt-03',
    employee: { id: 'e103-uuid-003', name: 'Dwight Schrute', code: 'EMP-003' },
    wage: 5400,
    wageType: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '2021-08-15',
    endDate: null,
    structureName: 'Sales Commission Base',
    scheduleName: 'Standard 40h',
  },
  {
    id: 'cnt-04',
    employee: { id: 'e104-uuid-004', name: 'Pam Beesly', code: 'EMP-004' },
    wage: 4200,
    wageType: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '2022-03-10',
    endDate: null,
    structureName: 'Regular Full-Time',
    scheduleName: 'Standard 40h',
  },
  {
    id: 'cnt-05',
    employee: { id: 'e106-uuid-006', name: 'Alex Vance', code: 'EMP-006' },
    wage: 45,
    wageType: 'HOURLY',
    status: 'ACTIVE',
    startDate: '2024-02-01',
    endDate: '2025-02-01',
    structureName: 'Hourly Contractor',
    scheduleName: 'Flexible 35h',
  },
];

export const contractApi = {
  async getContracts() {
    try {
      const res = await apiClient.get('/contracts/my');
      if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      return DEFAULT_CONTRACTS;
    } catch {
      return DEFAULT_CONTRACTS;
    }
  },

  async getContractById(id) {
    try {
      const res = await apiClient.get(`/contracts/${id}`);
      return res.data;
    } catch {
      return DEFAULT_CONTRACTS.find((c) => c.id === id) || DEFAULT_CONTRACTS[0];
    }
  },

  async createContract(data) {
    try {
      const res = await apiClient.post('/contracts', data);
      return res.data;
    } catch {
      const newContract = {
        id: `cnt-${Date.now()}`,
        status: 'ACTIVE',
        ...data,
      };
      DEFAULT_CONTRACTS.unshift(newContract);
      return newContract;
    }
  },

  async updateContractStatus(id, status) {
    try {
      const res = await apiClient.patch(`/contracts/${id}/status?status=${status}`);
      return res.data;
    } catch {
      const found = DEFAULT_CONTRACTS.find((c) => c.id === id);
      if (found) found.status = status;
      return found;
    }
  },
};
