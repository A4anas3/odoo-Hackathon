import { apiClient } from '../../../lib/api/client';

export const scheduleApi = {
  async getAllSchedules() {
    const res = await apiClient.get('/schedules');
    return Array.isArray(res.data) ? res.data : [];
  },

  async getScheduleById(id) {
    const res = await apiClient.get(`/schedules/${id}`);
    return res.data;
  },

  async createSchedule(data) {
    const res = await apiClient.post('/schedules', data);
    return res.data;
  },

  async updateSchedule(id, data) {
    const res = await apiClient.put(`/schedules/${id}`, data);
    return res.data;
  },

  async deleteSchedule(id) {
    const res = await apiClient.delete(`/schedules/${id}`);
    return res.data;
  },
};
