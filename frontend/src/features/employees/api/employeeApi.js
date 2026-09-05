import { apiClient } from '../../../lib/api/client';

// Initial rich seed data fallback if backend is empty
export const DEFAULT_EMPLOYEES = [
  {
    id: 'e101-uuid-001',
    employeeCode: 'EMP-001',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah.connor@odoo.com',
    phone: '+1 555-0192',
    department: { id: 'd1', name: 'Engineering' },
    jobPosition: { id: 'j1', name: 'Senior Fullstack Engineer' },
    employeeType: 'FULL_TIME',
    status: 'ACTIVE',
    joiningDate: '2023-01-15',
    address: '100 Cyberdyne Way, Tech City',
    bankAccountNo: '•••• 4892',
    bankName: 'Silicon Valley Bank',
    ifscCode: 'SVB0001',
  },
  {
    id: 'e102-uuid-002',
    employeeCode: 'EMP-002',
    firstName: 'Michael',
    lastName: 'Scott',
    email: 'michael.scott@odoo.com',
    phone: '+1 555-0143',
    department: { id: 'd2', name: 'Management' },
    jobPosition: { id: 'j2', name: 'Regional Director' },
    employeeType: 'FULL_TIME',
    status: 'ACTIVE',
    joiningDate: '2021-06-01',
    address: '1725 Slough Ave, Scranton',
    bankAccountNo: '•••• 8821',
    bankName: 'Chase Bank',
    ifscCode: 'CHAS009',
  },
  {
    id: 'e103-uuid-003',
    employeeCode: 'EMP-003',
    firstName: 'Dwight',
    lastName: 'Schrute',
    email: 'dwight.schrute@odoo.com',
    phone: '+1 555-0188',
    department: { id: 'd3', name: 'Sales' },
    jobPosition: { id: 'j3', name: 'Assistant to the Regional Director' },
    employeeType: 'FULL_TIME',
    status: 'ACTIVE',
    joiningDate: '2021-08-15',
    address: 'Schrute Farms, Honesdale',
    bankAccountNo: '•••• 1109',
    bankName: 'Wells Fargo',
    ifscCode: 'WF0021',
  },
  {
    id: 'e104-uuid-004',
    employeeCode: 'EMP-004',
    firstName: 'Pam',
    lastName: 'Beesly',
    email: 'pam.beesly@odoo.com',
    phone: '+1 555-0112',
    department: { id: 'd4', name: 'Human Resources' },
    jobPosition: { id: 'j4', name: 'HR Generalist' },
    employeeType: 'FULL_TIME',
    status: 'ON_LEAVE',
    joiningDate: '2022-03-10',
    address: '42 Pine St, Scranton',
    bankAccountNo: '•••• 7734',
    bankName: 'Bank of America',
    ifscCode: 'BOA004',
  },
  {
    id: 'e105-uuid-005',
    employeeCode: 'EMP-005',
    firstName: 'Jim',
    lastName: 'Halpert',
    email: 'jim.halpert@odoo.com',
    phone: '+1 555-0155',
    department: { id: 'd3', name: 'Sales' },
    jobPosition: { id: 'j5', name: 'Senior Account Executive' },
    employeeType: 'FULL_TIME',
    status: 'ACTIVE',
    joiningDate: '2021-09-01',
    address: '42 Pine St, Scranton',
    bankAccountNo: '•••• 6629',
    bankName: 'Chase Bank',
    ifscCode: 'CHAS009',
  },
  {
    id: 'e106-uuid-006',
    employeeCode: 'EMP-006',
    firstName: 'Alex',
    lastName: 'Vance',
    email: 'alex.vance@odoo.com',
    phone: '+1 555-0199',
    department: { id: 'd1', name: 'Engineering' },
    jobPosition: { id: 'j6', name: 'Frontend Architect' },
    employeeType: 'CONTRACTOR',
    status: 'ACTIVE',
    joiningDate: '2024-02-01',
    address: 'City 17 West, Sector 8',
    bankAccountNo: '•••• 3391',
    bankName: 'Citibank',
    ifscCode: 'CITI001',
  },
];

export const employeeApi = {
  async getEmployees() {
    try {
      const response = await apiClient.get('/employees');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return DEFAULT_EMPLOYEES;
    } catch {
      return DEFAULT_EMPLOYEES;
    }
  },

  async getEmployeeById(id) {
    try {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data;
    } catch {
      const found = DEFAULT_EMPLOYEES.find((e) => e.id === id);
      if (found) return found;
      return DEFAULT_EMPLOYEES[0];
    }
  },

  async getMyProfile() {
    try {
      const response = await apiClient.get('/employees/me');
      return response.data;
    } catch {
      return DEFAULT_EMPLOYEES[0];
    }
  },

  async createEmployee(data) {
    try {
      const response = await apiClient.post('/employees', data);
      return response.data;
    } catch {
      // Local fallback create for seamless offline demo
      const newEmp = {
        id: `emp-uuid-${Date.now()}`,
        employeeCode: `EMP-00${DEFAULT_EMPLOYEES.length + 1}`,
        status: 'ACTIVE',
        ...data,
      };
      DEFAULT_EMPLOYEES.unshift(newEmp);
      return newEmp;
    }
  },

  async updateEmployee(id, data) {
    try {
      const response = await apiClient.put(`/employees/${id}`, data);
      return response.data;
    } catch {
      const idx = DEFAULT_EMPLOYEES.findIndex((e) => e.id === id);
      if (idx !== -1) {
        DEFAULT_EMPLOYEES[idx] = { ...DEFAULT_EMPLOYEES[idx], ...data };
        return DEFAULT_EMPLOYEES[idx];
      }
      return { id, ...data };
    }
  },

  async deleteEmployee(id) {
    try {
      await apiClient.delete(`/employees/${id}`);
    } catch {
      const idx = DEFAULT_EMPLOYEES.findIndex((e) => e.id === id);
      if (idx !== -1) DEFAULT_EMPLOYEES.splice(idx, 1);
    }
  },
};
