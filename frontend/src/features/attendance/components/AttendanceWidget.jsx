import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { useMyProfile } from '../../employees/hooks/useEmployees';
import { useToast } from '../../../hooks/useToast';
import { Clock, LogIn, LogOut, X, Loader2 } from 'lucide-react';
import { formatTime, formatHours } from '../../../lib/utils/formatters';

export function AttendanceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { data: profile } = useMyProfile();

  // Fetch today's attendance record for current logged-in user
  const { data: todayAttendance, isLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.getTodayAttendance(),
    refetchInterval: 30000, // Sync every 30 seconds
  });

  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const isCheckedOut = !!todayAttendance?.checkOut;

  // Live timer for elapsed shift duration
  const [elapsedText, setElapsedText] = useState('0h 00m');

  useEffect(() => {
    if (!isCheckedIn || !todayAttendance?.checkIn) {
      if (todayAttendance?.workedHours != null && todayAttendance.workedHours > 0) {
        setElapsedText(formatHours(todayAttendance.workedHours));
      } else {
        setElapsedText('0h 00m');
      }
      return;
    }

    const updateTimer = () => {
      const checkInTime = new Date(todayAttendance.checkIn).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - checkInTime);
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      setElapsedText(`${hours}h ${mins < 10 ? '0' : ''}${mins}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn, todayAttendance]);

  // Click outside listener to auto-close popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Check-in recorded. Status is now active (Green).');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to check in.');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Check-out recorded. Shift concluded (Red).');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to check out.');
    },
  });

  const handleAction = () => {
    if (isCheckedIn) {
      checkOutMutation.mutate();
    } else {
      checkInMutation.mutate();
    }
  };

  const isPending = checkInMutation.isPending || checkOutMutation.isPending;

  // Resolve user display name
  const userName = profile?.fullName?.trim() || user?.name || user?.email?.split('@')[0] || 'Employee';
  const companyName = 'Odoo HRMS';

  return (
    <div className="relative inline-block" ref={popupRef}>
      {/* Navbar Attendance Trigger Button with Status Dot */}
      <button
        type="button"
        id="attendance-widget-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 transition-all shadow-2xs cursor-pointer group"
        title={isCheckedIn ? 'Checked In (Active Session)' : 'Checked Out / Not Checked In'}
      >
        <div className="relative flex items-center justify-center">
          <Clock className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
          {/* Status Dot Indicator: Green if checked in, Red if checked out / idle */}
          <span
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white transition-all ${
              isCheckedIn
                ? 'bg-emerald-500 ring-2 ring-emerald-400/30 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
        </div>
        <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
          {isCheckedIn ? 'Checked In' : 'Check In'}
        </span>
      </button>

      {/* Floating Attendance Widget Popup */}
      {isOpen && (
        <div
          id="attendance-widget-popup"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popup Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight">Attendance Widget</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Greeting */}
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-400">Welcome to {companyName}</span>
            <h3 className="text-xl font-bold text-slate-900 leading-tight mt-0.5 font-serif">
              {userName}!
            </h3>
          </div>

          {/* Time & Live Elapsed Display */}
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100/80">
              <span className="font-semibold text-slate-600">
                {isCheckedIn && todayAttendance?.checkIn
                  ? `${formatTime(todayAttendance.checkIn)} — Now`
                  : isCheckedOut && todayAttendance?.checkIn && todayAttendance?.checkOut
                  ? `${formatTime(todayAttendance.checkIn)} — ${formatTime(todayAttendance.checkOut)}`
                  : 'Shift Not Started'}
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {elapsedText}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100/80">
              <span className="font-semibold text-slate-600">Today</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {isCheckedOut && todayAttendance?.workedHours != null
                  ? formatHours(todayAttendance.workedHours)
                  : elapsedText}
              </span>
            </div>
          </div>

          {/* Action Button: Check In / Check Out */}
          <div className="mt-5">
            <button
              type="button"
              id="attendance-action-btn"
              disabled={isPending || (isCheckedOut && !isCheckedIn)}
              onClick={handleAction}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isCheckedIn
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-[0.99] shadow-rose-200'
                  : isCheckedOut
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-200'
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isCheckedIn ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Check Out</span>
                </>
              ) : isCheckedOut ? (
                <span>Completed for Today</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Check In</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Subtext */}
          <p className="mt-4 text-[11px] text-slate-400 text-center leading-relaxed">
            Employees can mark attendance from the quick widget and review records from the Attendance module.
          </p>
        </div>
      )}
    </div>
  );
}
