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
      return res.data;
    } catch {
      return DEFAULT_LEAVE_REQUESTS;
    }
  },

  async getPendingRequests() {
    try {
      const res = await apiClient.get('/time-off/requests/pending');
      return res.data;
    } catch {
      return DEFAULT_LEAVE_REQUESTS.filter((r) => r.status === 'PENDING');
    }
  },

  async submitRequest(data) {
    try {
      const res = await apiClient.post('/time-off/requests', data);
      return res.data;
    } catch {
      const newReq = {
        id: `req-${Date.now()}`,
        employee: { name: 'Current User', department: 'General' },
        status: 'PENDING',
        appliedAt: new Date().toISOString().split('T')[0],
        ...data,
      };
      DEFAULT_LEAVE_REQUESTS.unshift(newReq);
      return newReq;
    }
  },

  async reviewRequest(id, status) {
    try {
      const res = await apiClient.patch(`/time-off/requests/${id}/review`, { status });
      return res.data;
    } catch {
      const item = DEFAULT_LEAVE_REQUESTS.find((r) => r.id === id);
      if (item) item.status = status;
      return item;
    }
  },
};
