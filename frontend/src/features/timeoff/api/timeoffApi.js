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

  async submitRequest(data) {
    const res = await apiClient.post('/time-off/requests', data);
    return res.data;
  },

  async reviewRequest(id, status, rejectionReason = '') {
    const res = await apiClient.patch(`/time-off/requests/${id}/review`, { status, rejectionReason });
    return res.data;
  },
};
