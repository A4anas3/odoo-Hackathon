import { apiClient } from '../../../lib/api/client';

export const DEFAULT_ATTENDANCE_LOGS = [
  {
    id: 'att-01',
    date: '2026-09-04',
    employee: { id: 'e1', name: 'Sarah Connor', code: 'EMP-001' },
    checkIn: '09:02',
    checkOut: '18:05',
    workedHours: 8.05,
    overtime: 0.05,
    lateMinutes: 2,
    status: 'PRESENT',
  },
  {
    id: 'att-02',
    date: '2026-09-04',
    employee: { id: 'e2', name: 'Michael Scott', code: 'EMP-002' },
    checkIn: '09:45',
    checkOut: '18:00',
    workedHours: 7.25,
    overtime: 0,
    lateMinutes: 45,
    status: 'LATE',
  },
  {
    id: 'att-03',
    date: '2026-09-04',
    employee: { id: 'e3', name: 'Dwight Schrute', code: 'EMP-003' },
    checkIn: '08:30',
    checkOut: '19:30',
    workedHours: 10.0,
    overtime: 2.0,
    lateMinutes: 0,
    status: 'OVERTIME',
  },
  {
    id: 'att-04',
    date: '2026-09-04',
    employee: { id: 'e4', name: 'Pam Beesly', code: 'EMP-004' },
    checkIn: null,
    checkOut: null,
    workedHours: 0,
    overtime: 0,
    lateMinutes: 0,
    status: 'ABSENT',
  },
  {
    id: 'att-05',
    date: '2026-09-04',
    employee: { id: 'e5', name: 'Jim Halpert', code: 'EMP-005' },
    checkIn: '08:55',
    checkOut: null,
    workedHours: 4.5,
    overtime: 0,
    lateMinutes: 0,
    status: 'MISSING_CHECKOUT',
  },
];

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

  async getAttendanceHistory(params = {}) {
    try {
      const res = await apiClient.get('/attendance/my', { params });
      if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      const allRes = await apiClient.get('/attendance');
      return Array.isArray(allRes.data) ? allRes.data : [];
    } catch {
      const allRes = await apiClient.get('/attendance');
      return Array.isArray(allRes.data) ? allRes.data : [];
    }
  },

  async getAllAttendance() {
    const res = await apiClient.get('/attendance');
    return Array.isArray(res.data) ? res.data : [];
  },
};
