import { apiClient } from '../../../lib/api/client';

export const attendanceApi = {
  async getTodayAttendance() {
    try {
      const res = await apiClient.get('/attendance/today');
      return res.data;
    } catch {
      return null;
    }
  },

  async checkIn() {
    const res = await apiClient.post('/attendance/check-in');
    return res.data;
  },

  async checkOut() {
    const res = await apiClient.post('/attendance/check-out');
    return res.data;
  },

  async getMyAttendance(params = {}) {
    try {
      const res = await apiClient.get('/attendance/my', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getAttendanceHistory(params = {}) {
    return this.getMyAttendance(params);
  },

  async getAllAttendance() {
    try {
      const res = await apiClient.get('/attendance');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
};
