import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { Checkbox } from '../../../components/form/Checkbox';
import { useToast } from '../../../hooks/useToast';
import { Clock, Save, Calendar, CheckCircle2 } from 'lucide-react';
import { scheduleApi } from '../api/scheduleApi';

const ALL_WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const INITIAL_SCHEDULE = ALL_WEEKDAYS.map((day) => ({
  day,
  enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
  startTime: '09:00',
  endTime: '18:00',
  breakMinutes: 60,
}));

export function ScheduleEditorPage() {
  const toast = useToast();
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [scheduleName, setScheduleName] = useState('Standard 40h Full-Time');
  const [scheduleDescription, setScheduleDescription] = useState('Standard Monday to Friday 40-hour work week');
  const [days, setDays] = useState(INITIAL_SCHEDULE);
  const [isSaving, setIsSaving] = useState(false);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: scheduleApi.getAllSchedules,
  });

  useEffect(() => {
    if (schedules.length > 0) {
      const active = schedules.find((s) => s.id === selectedScheduleId) || schedules[0];
      if (active) {
        setSelectedScheduleId(active.id);
        setScheduleName(active.name || 'Standard 40h Full-Time');
        setScheduleDescription(active.description || '');

        if (active.days && active.days.length > 0) {
          const mapped = ALL_WEEKDAYS.map((dayName) => {
            const found = active.days.find(
              (d) => d.weekday?.toLowerCase() === dayName.toLowerCase()
            );
            if (found) {
              return {
                day: dayName,
                enabled: true,
                startTime: found.startTime ? found.startTime.substring(0, 5) : '09:00',
                endTime: found.endTime ? found.endTime.substring(0, 5) : '18:00',
                breakMinutes: found.breakMinutes != null ? found.breakMinutes : 60,
              };
            }
            return {
              day: dayName,
              enabled: false,
              startTime: '09:00',
              endTime: '18:00',
              breakMinutes: 0,
            };
          });
          setDays(mapped);
        }
      }
    }
  }, [schedules, selectedScheduleId]);

  const calculateDayHours = (day) => {
    if (!day.enabled) return 0;
    const [startH, startM] = day.startTime.split(':').map(Number);
    const [endH, endM] = day.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const diff = endTotal - startTotal - day.breakMinutes;
    return Math.max(diff / 60, 0);
  };

  const totalWeeklyHours = days.reduce((sum, d) => sum + calculateDayHours(d), 0);

  const handleDayChange = (index, field, value) => {
    const updated = [...days];
    updated[index][field] = value;
    setDays(updated);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(`Schedule "${scheduleName}" saved successfully (${totalWeeklyHours.toFixed(1)} hrs/week).`);
    }, 400);
  };

  return (
    <PageContainer
      title="Working Schedules"
      description="Define standard shift timings, lunch breaks, and compute weekly contractual hours."
      actions={
        <Button variant="primary" size="sm" icon={Save} isLoading={isSaving} onClick={handleSave}>
          Save Schedule
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Schedule Form / Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Weekly Shift Timings"
              subtitle="Configure working hours per weekday"
            />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Working Day</th>
                      <th className="py-2.5 px-4">Shift Start</th>
                      <th className="py-2.5 px-4">Shift End</th>
                      <th className="py-2.5 px-4">Break (Min)</th>
                      <th className="py-2.5 px-4 text-right">Daily Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {days.map((day, idx) => {
                      const dailyHours = calculateDayHours(day);
                      return (
                        <tr
                          key={day.day}
                          className={day.enabled ? 'hover:bg-slate-50/60' : 'bg-slate-50/40 opacity-60'}
                        >
                          <td className="py-2.5 px-4">
                            <Checkbox
                              label={day.day}
                              checked={day.enabled}
                              onChange={(e) => handleDayChange(idx, 'enabled', e.target.checked)}
                            />
                          </td>
                          <td className="py-2.5 px-4">
                            <Input
                              type="time"
                              disabled={!day.enabled}
                              value={day.startTime}
                              onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                              className="w-28"
                            />
                          </td>
                          <td className="py-2.5 px-4">
                            <Input
                              type="time"
                              disabled={!day.enabled}
                              value={day.endTime}
                              onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                              className="w-28"
                            />
                          </td>
                          <td className="py-2.5 px-4">
                            <Input
                              type="number"
                              disabled={!day.enabled}
                              value={day.breakMinutes}
                              onChange={(e) =>
                                handleDayChange(idx, 'breakMinutes', Number(e.target.value))
                              }
                              className="w-20"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                            {day.enabled ? `${dailyHours.toFixed(1)}h` : 'Off'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Summary Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Schedule Details" />
            <CardContent className="space-y-4 p-4">
              {schedules.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Select Database Schedule
                  </label>
                  <Select
                    options={schedules.map((s) => ({ value: s.id, label: s.name }))}
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Schedule Name
                </label>
                <Input
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="Schedule title"
                />
              </div>

              {scheduleDescription && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100">
                  {scheduleDescription}
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Total Weekly Hours
                  </span>
                  <div className="text-2xl font-bold text-[#714B67] mt-0.5">
                    {totalWeeklyHours.toFixed(1)} hrs
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#714B67]/10 flex items-center justify-center text-[#714B67]">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Active Working Days</span>
                  <span className="font-semibold text-slate-800">
                    {days.filter((d) => d.enabled).length} days / week
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Shift</span>
                  <span className="font-semibold text-slate-800">09:00 - 18:00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
