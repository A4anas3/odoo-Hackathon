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

  async getAttendanceSummary() {
    try {
      const res = await apiClient.get('/attendance/summary');
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
      return res.data;
    } catch {
      return [];
    }
  },

  async getAttendanceHistory(params = {}) {
    return this.getMyAttendance(params);
  },

  async getAllAttendance(params = {}) {
    try {
      const res = await apiClient.get('/attendance', { params });
      return res.data;
    } catch {
      return [];
    }
  },

  async getEmployeeAttendance(employeeId, params = {}) {
    try {
      const res = await apiClient.get(`/attendance/employee/${employeeId}`, { params });
      return res.data;
    } catch {
      return [];
    }
  },

  async getAttendanceById(id) {
    const res = await apiClient.get(`/attendance/${id}`);
    return res.data;
  },

  async updateAttendance(id, data) {
    const res = await apiClient.put(`/attendance/${id}`, data);
    return res.data;
  },

  async correctAttendance(id, data) {
    const res = await apiClient.patch(`/attendance/${id}/correct`, data);
    return res.data;
  },
};
