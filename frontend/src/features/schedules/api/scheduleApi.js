import { apiClient } from '../../../lib/api/client';

export const scheduleApi = {
  async getAllSchedules() {
    const res = await apiClient.get('/schedules');
    return res.data;
  },

  async getScheduleById(id) {
    const res = await apiClient.get(`/schedules/${id}`);
    return res.data;
  },
};
