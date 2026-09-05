import { apiClient } from '../../../lib/api/client';

export const DEFAULT_LEAVE_REQUESTS = [
  {
    id: 'req-01',
    employee: { id: 'e1', name: 'Sarah Connor', department: 'Engineering' },
    type: 'Annual Leave',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    durationDays: 5,
    reason: 'Family holiday travel',
    status: 'PENDING',
    appliedAt: '2026-09-04',
  },
  {
    id: 'req-02',
    employee: { id: 'e4', name: 'Pam Beesly', department: 'Human Resources' },
    type: 'Sick Leave',
    startDate: '2026-09-02',
    endDate: '2026-09-03',
    durationDays: 2,
    reason: 'Medical recovery',
    status: 'APPROVED',
    appliedAt: '2026-09-01',
  },
  {
    id: 'req-03',
    employee: { id: 'e3', name: 'Dwight Schrute', department: 'Sales' },
    type: 'Annual Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-22',
    durationDays: 3,
    reason: 'Beet festival organization',
    status: 'REJECTED',
    appliedAt: '2026-08-10',
  },
  {
    id: 'req-04',
    employee: { id: 'e6', name: 'Alex Vance', department: 'Engineering' },
    type: 'Casual Leave',
    startDate: '2026-09-20',
    endDate: '2026-09-21',
    durationDays: 2,
    reason: 'Personal affairs',
    status: 'PENDING',
    appliedAt: '2026-09-04',
  },
];

export const timeoffApi = {
  async getMyRequests() {
    try {
      const res = await apiClient.get('/time-off/requests/my');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getAllRequests() {
    try {
      const res = await apiClient.get('/time-off/requests');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getPendingRequests() {
    try {
      const res = await apiClient.get('/time-off/requests/pending');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getTypes() {
    try {
      const res = await apiClient.get('/time-off/types');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getMyAllocations() {
    try {
      const res = await apiClient.get('/time-off/allocations/my');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async submitRequest(data) {
    const res = await apiClient.post('/time-off/requests', data);
    return res.data;
  },

  async reviewRequest(id, status, rejectionReason = '') {
    const res = await apiClient.patch(`/time-off/requests/${id}/review`, { status, rejectionReason });
    return res.data;
  },
};
