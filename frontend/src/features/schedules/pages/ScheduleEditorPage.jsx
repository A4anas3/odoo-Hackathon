import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { scheduleApi } from '../api/scheduleApi';
import { useToast } from '../../../hooks/useToast';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  Trash2,
  CheckCircle2,
  Building2,
  Layers,
  Save,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ScheduleEditorPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Navigation mode: 'list' | 'form'
  const [viewMode, setViewMode] = useState('list');
  // List tabs: 'list' | 'calendar'
  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Currently selected schedule row (for visual highlight in list)
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Active schedule being edited in form view
  const [activeScheduleId, setActiveScheduleId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('My Company');
  const [formTimezone, setFormTimezone] = useState('Company timezone');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formDays, setFormDays] = useState([]);

  // Query schedules from backend
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: scheduleApi.getAllSchedules,
  });

  // Default select first schedule if none selected
  useMemo(() => {
    if (!selectedRowId && schedules.length > 0) {
      setSelectedRowId(schedules[0].id);
    }
  }, [schedules, selectedRowId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => scheduleApi.createSchedule(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success(`Schedule "${saved.name}" created successfully.`);
      setSelectedRowId(saved.id);
      setViewMode('list');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create schedule.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => scheduleApi.updateSchedule(id, data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success(`Schedule "${saved.name}" updated successfully.`);
      setSelectedRowId(saved.id);
      setViewMode('list');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update schedule.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => scheduleApi.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted successfully.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to delete schedule.');
    },
  });

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (statusFilter !== 'ALL' && (s.status || 'ACTIVE').toUpperCase() !== statusFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = (s.name || '').toLowerCase().includes(query);
        const companyMatch = (s.company || '').toLowerCase().includes(query);
        return nameMatch || companyMatch;
      }
      return true;
    });
  }, [schedules, searchQuery, statusFilter]);

  // Open existing schedule in form
  const handleOpenForm = (schedule) => {
    setSelectedRowId(schedule.id);
    setActiveScheduleId(schedule.id);
    setFormName(schedule.name || '');
    setFormCompany(schedule.company || 'My Company');
    setFormTimezone(schedule.timezone || 'Company timezone');
    setFormStatus(schedule.status || 'ACTIVE');

    const mappedDays = (schedule.days || []).map((d) => {
      const breakM = d.breakMinutes != null ? d.breakMinutes : 60;
      const hours = d.hours != null ? d.hours : calculateDayHours(d.startTime, d.endTime, breakM);
      return {
        id: d.id,
        weekday: d.weekday || 'Monday',
        startTime: formatTimeInput(d.startTime) || '09:00',
        endTime: formatTimeInput(d.endTime) || '18:00',
        breakMinutes: breakM,
        hours: hours,
      };
    });
    setFormDays(mappedDays);
    setViewMode('form');
  };

  // Open new schedule form
  const handleNewSchedule = () => {
    setActiveScheduleId(null);
    setFormName('New Working Schedule');
    setFormCompany('My Company');
    setFormTimezone('Company timezone');
    setFormStatus('ACTIVE');
    setFormDays([
      { weekday: 'Monday', startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8 },
      { weekday: 'Tuesday', startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8 },
      { weekday: 'Wednesday', startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8 },
      { weekday: 'Thursday', startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8 },
      { weekday: 'Friday', startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8 },
    ]);
    setViewMode('form');
  };

  const handleDayChange = (index, field, value) => {
    const updated = [...formDays];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'startTime' || field === 'endTime' || field === 'breakMinutes') {
      const start = updated[index].startTime || '09:00';
      const end = updated[index].endTime || '18:00';
      const breakM = Number(updated[index].breakMinutes != null ? updated[index].breakMinutes : 60);
      updated[index].hours = calculateDayHours(start, end, breakM);
    }
    setFormDays(updated);
  };

  const handleAddDay = () => {
    const nextWeekday = WEEKDAYS[formDays.length % WEEKDAYS.length] || 'Monday';
    setFormDays([
      ...formDays,
      {
        weekday: nextWeekday,
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        hours: 8,
      },
    ]);
  };

  const handleRemoveDay = (index) => {
    setFormDays(formDays.filter((_, idx) => idx !== index));
  };

  const derivedDaysPerWeek = useMemo(() => {
    const uniqueDays = new Set(formDays.map((d) => d.weekday));
    return uniqueDays.size;
  }, [formDays]);

  const totalCalculatedHours = useMemo(() => {
    const sum = formDays.reduce((acc, d) => acc + (Number(d.hours) || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [formDays]);

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error('Please enter a schedule name.');
      return;
    }

    const payload = {
      name: formName.trim(),
      company: formCompany.trim() || 'My Company',
      calendarType: 'STANDARD',
      timezone: formTimezone || 'Company timezone',
      status: formStatus || 'ACTIVE',
      days: formDays.map((d) => ({
        weekday: d.weekday,
        startTime: ensureLocalTime(d.startTime),
        endTime: ensureLocalTime(d.endTime),
        breakMinutes: Number(d.breakMinutes || 0),
      })),
    };

    if (activeScheduleId) {
      updateMutation.mutate({ id: activeScheduleId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <PageContainer
      title={
        viewMode === 'list' ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNewSchedule}
              className="bg-[#008784] hover:bg-[#007370] text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Schedule</span>
            </button>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Working Schedules</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to list</span>
            </button>
            <span className="text-lg font-bold text-slate-900">{formName || 'Working Schedule'}</span>
          </div>
        )
      }
      description={
        viewMode === 'list'
          ? 'Manage enterprise working patterns, shift timetables, and expected weekly hours.'
          : 'Define weekly working pattern: day, start/end time, optional break and hours.'
      }
    >
      {viewMode === 'list' ? (
        /* ======================== LIST VIEW ======================== */
        <div className="space-y-4">
          {/* Sub-Header: Tabs & Search Filter Columns Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            {/* Tabs: List / Calendar matching wireframe */}
            <div className="flex items-center gap-4 px-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`text-xs font-bold pb-1 transition-all relative ${
                  activeTab === 'list'
                    ? 'text-[#008784] border-b-2 border-[#008784]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`text-xs font-bold pb-1 transition-all relative ${
                  activeTab === 'calendar'
                    ? 'text-[#008784] border-b-2 border-[#008784]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Calendar
              </button>
            </div>

            {/* Search, Filter, Columns Bar matching wireframe */}
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search schedules..."
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#008784] focus:bg-white transition-all text-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'ALL' ? 'ACTIVE' : statusFilter === 'ACTIVE' ? 'INACTIVE' : 'ALL')}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter {statusFilter !== 'ALL' ? `(${statusFilter})` : ''}</span>
              </button>

              <button
                type="button"
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Columns</span>
              </button>
            </div>
          </div>

          {/* Schedule Table matching wireframe */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading working schedules...</div>
            ) : filteredSchedules.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No working schedules found.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-600 font-semibold text-[11px]">
                    <th className="py-3 px-5">Schedule Name</th>
                    <th className="py-3 px-5">Days / Week</th>
                    <th className="py-3 px-5">Hours / Week</th>
                    <th className="py-3 px-5">Company</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchedules.map((sched) => {
                    const daysCount = sched.daysPerWeek != null ? sched.daysPerWeek : (sched.days?.length || 0);
                    const hoursDisplay = sched.hoursPerWeek != null ? `${sched.hoursPerWeek}h` : '—';
                    const isActive = (sched.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
                    const isSelected = selectedRowId === sched.id;

                    return (
                      <tr
                        key={sched.id}
                        onClick={() => handleOpenForm(sched)}
                        className={`cursor-pointer transition-colors group ${
                          isSelected
                            ? 'bg-blue-50/60 border-l-4 border-blue-500'
                            : 'hover:bg-slate-50/60 border-l-4 border-transparent'
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <span className={`text-xs ${isSelected ? 'font-bold text-blue-700' : 'text-slate-800'}`}>
                            {sched.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 font-medium">{daysCount}</td>
                        <td className="py-3.5 px-5 text-slate-700 font-medium">{hoursDisplay}</td>
                        <td className="py-3.5 px-5 text-slate-600">{sched.company || 'My Company'}</td>
                        <td className="py-3.5 px-5">
                          {isActive ? (
                            <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Wireframe footnote indicator */}
            <div className="p-3 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-400 italic">
              Select a schedule to open its Form view
            </div>
          </div>
        </div>
      ) : (
        /* ======================== FORM VIEW ======================== */
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
            {/* Form Header with Save */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {formName || 'Working Schedule Form'}
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                isLoading={isSaving}
                onClick={handleSave}
                className="bg-[#008784] hover:bg-[#007370] text-white text-xs px-4 shadow-2xs"
              >
                Save Schedule
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Form Metadata Grid matching wireframe */}
              <div className="space-y-4 text-xs">
                {/* Row 1: Schedule Name & Company (2 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Schedule Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#008784] shadow-2xs"
                      placeholder="e.g. 40 Hours / Week"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Company</label>
                    <input
                      type="text"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#008784] shadow-2xs"
                      placeholder="e.g. My Company"
                    />
                  </div>
                </div>

                {/* Row 2: Days per Week, Hours per Week, Timezone (3 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Days per Week</label>
                    <input
                      type="text"
                      readOnly
                      value={derivedDaysPerWeek}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-not-allowed shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Hours per Week</label>
                    <input
                      type="text"
                      readOnly
                      value={`${totalCalculatedHours}h`}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-not-allowed shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Timezone</label>
                    <input
                      type="text"
                      value={formTimezone}
                      onChange={(e) => setFormTimezone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#008784] shadow-2xs"
                      placeholder="Company timezone"
                    />
                  </div>
                </div>
              </div>

              {/* Weekly Schedule Section matching wireframe */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Weekly Schedule</h3>
                  <button
                    type="button"
                    onClick={handleAddDay}
                    className="border border-[#008784] text-[#008784] hover:bg-teal-50 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Day</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold text-[10px]">
                        <th className="py-2.5 px-4 font-semibold">Day</th>
                        <th className="py-2.5 px-4 font-semibold">Start Time</th>
                        <th className="py-2.5 px-4 font-semibold">End Time</th>
                        <th className="py-2.5 px-4 font-semibold">Break</th>
                        <th className="py-2.5 px-4 font-semibold">Hours</th>
                        <th className="py-2.5 px-4 text-center font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formDays.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No days defined for this schedule. Click "+ Add Day" above.
                          </td>
                        </tr>
                      ) : (
                        formDays.map((d, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2 px-4">
                              <select
                                value={d.weekday}
                                onChange={(e) => handleDayChange(idx, 'weekday', e.target.value)}
                                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#008784]"
                              >
                                {WEEKDAYS.map((w) => (
                                  <option key={w} value={w}>
                                    {w}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="time"
                                value={d.startTime}
                                onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#008784]"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="time"
                                value={d.endTime}
                                onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#008784]"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <select
                                value={d.breakMinutes}
                                onChange={(e) => handleDayChange(idx, 'breakMinutes', Number(e.target.value))}
                                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-hidden focus:ring-1 focus:ring-[#008784]"
                              >
                                <option value={0}>0h (No break)</option>
                                <option value={30}>0.5h</option>
                                <option value={45}>45m</option>
                                <option value={60}>1h</option>
                                <option value={90}>1.5h</option>
                              </select>
                            </td>
                            <td className="py-2 px-4 font-semibold text-slate-800">{d.hours || 0}h</td>
                            <td className="py-2 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveDay(idx)}
                                className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
                                title="Remove day"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total Weekly Hours footer matching wireframe */}
                <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end pr-8 gap-2 text-xs">
                  <span className="text-slate-600 font-medium">Total Weekly Hours:</span>
                  <span className="font-bold text-slate-900">{totalCalculatedHours}h</span>
                </div>
              </div>
            </div>

            {/* Wireframe bottom note */}
            <div className="p-3.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 italic">
              Use this schedule as the employee/contract working pattern.
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

// Helpers
function calculateDayHours(startTime, endTime, breakMinutes) {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let totalM = endH * 60 + endM - (startH * 60 + startM);
  if (totalM < 0) totalM += 24 * 60; // night shift overnight
  const netM = Math.max(0, totalM - (Number(breakMinutes) || 0));
  return Math.round((netM / 60) * 10) / 10;
}

function formatTimeInput(timeStr) {
  if (!timeStr) return '';
  if (typeof timeStr === 'string' && timeStr.length >= 5) {
    return timeStr.substring(0, 5);
  }
  return timeStr;
}

function ensureLocalTime(timeStr) {
  if (!timeStr) return '09:00:00';
  if (timeStr.length === 5) return `${timeStr}:00`;
  return timeStr;
}

export default ScheduleEditorPage;
