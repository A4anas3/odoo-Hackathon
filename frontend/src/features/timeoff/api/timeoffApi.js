import { apiClient } from '../../../lib/api/client';

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

  async getAllocations(employeeId) {
    try {
      const url = employeeId ? `/time-off/allocations?employeeId=${employeeId}` : '/time-off/allocations';
      const res = await apiClient.get(url);
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

  async getRequestById(id) {
    const res = await apiClient.get(`/time-off/requests/${id}`);
    return res.data;
  },

  async getAllocationById(id) {
    const res = await apiClient.get(`/time-off/allocations/${id}`);
    return res.data;
  },

  async reviewAllocation(id, status, rejectionReason = '') {
    const res = await apiClient.patch(`/time-off/allocations/${id}/review`, { status, rejectionReason });
    return res.data;
  },

  async getTypeById(id) {
    const res = await apiClient.get(`/time-off/types/${id}`);
    return res.data;
  },

  async updateType(id, data) {
    const res = await apiClient.put(`/time-off/types/${id}`, data);
    return res.data;
  },

  async createTimeOffType(data) {
    const res = await apiClient.post('/time-off/types', data);
    return res.data;
  },

  async createAllocation(data) {
    const res = await apiClient.post('/time-off/allocations', data);
    return res.data;
  },
};
