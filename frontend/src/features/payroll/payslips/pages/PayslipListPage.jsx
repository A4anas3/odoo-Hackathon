import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/form/Checkbox';
import { payslipApi } from '../api/payslipApi';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { PERMISSIONS } from '@/config/permissions';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ROUTES } from '@/config/routes';
import { useToast } from '@/hooks/useToast';
import { Search, FileDown, Info, Eye, Layers, X, CheckSquare } from 'lucide-react';

export function PayslipListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useCurrentUser();
  const isAdminOrPayroll = can(PERMISSIONS.CAN_RUN_PAYROLL);

  const [search, setSearch] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL'); // 'ALL', 'FEB_2026', 'JAN_2026'
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedSlipIds, setSelectedSlipIds] = useState([]);

  // Clear selections when filter changes
  useEffect(() => {
    setSelectedSlipIds([]);
  }, [selectedPeriod, search]);

  // Query payslips from backend filtered via backend + cached in Redis
  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['payroll', 'payslips', isAdminOrPayroll, selectedPeriod, search],
    queryFn: () => {
      const params = {};
      if (selectedPeriod !== 'ALL') {
        params.month = selectedPeriod;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      return isAdminOrPayroll ? payslipApi.getAllPayslips(params) : payslipApi.getMyPayslips(params);
    },
  });

  const handleDownloadPdf = async (e, slipId, slipNum) => {
    e.stopPropagation();
    setDownloadingId(slipId);
    try {
      const blob = await payslipApi.downloadPayslipPdf(slipId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${slipNum || slipId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully.');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Results are filtered directly from backend and cached in Redis
  const filtered = payslips;

  // Toggle selection
  const toggleSelectAll = () => {
    if (filtered.length > 0 && selectedSlipIds.length === filtered.length) {
      setSelectedSlipIds([]);
    } else {
      setSelectedSlipIds(filtered.map((s) => s.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedSlipIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedSlipIds([]);

  // Calculate totals: selected if any, otherwise all filtered
  const isAnySelected = selectedSlipIds.length > 0;
  const targetSlips = isAnySelected
    ? filtered.filter((s) => selectedSlipIds.includes(s.id))
    : filtered;

  const summaryGross = targetSlips.reduce((sum, s) => sum + (s.grossSalary ?? 0), 0);
  const summaryDeductions = targetSlips.reduce((sum, s) => sum + (s.totalDeductions ?? 0), 0);
  const summaryNet = targetSlips.reduce(
    (sum, s) => sum + (s.netSalary ?? ((s.grossSalary ?? 0) - (s.totalDeductions ?? 0))),
    0
  );

  return (
    <PageContainer
      title="Payslips"
      description="Audit view of all employee payslips with live selection totals."
    >
      {/* Search & Period Filter Pills Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-64 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search payslips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#714B67] transition-all"
            />
          </div>

          {/* Period Pills (Matches Wireframe 4) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedPeriod('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                selectedPeriod === 'ALL'
                  ? 'bg-white text-[#714B67] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Periods
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('FEB_2026')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                selectedPeriod === 'FEB_2026'
                  ? 'bg-white text-[#714B67] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Period: Feb 2026
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('JAN_2026')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                selectedPeriod === 'JAN_2026'
                  ? 'bg-white text-[#714B67] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Period: Jan 2026
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dynamic Selection Summary Badge in Filter Bar */}
          {isAnySelected && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#714B67]/10 border border-[#714B67]/20 rounded-lg text-xs">
              <span className="font-bold text-[#714B67]">
                Selected {selectedSlipIds.length} / {filtered.length}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">
                Gross: <strong className="text-slate-900">{formatCurrency(summaryGross, 'INR')}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">
                Net: <strong className="text-emerald-700">{formatCurrency(summaryNet, 'INR')}</strong>
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="ml-1 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className="text-xs text-slate-500 font-medium">
            Showing {filtered.length} payslip{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Payslips Table (Matches Wireframe 4 with Checkboxes & Live Totals) */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">
                  <Checkbox
                    checked={filtered.length > 0 && selectedSlipIds.length === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3">Employee</th>
                <th className="p-3">Structure</th>
                <th className="p-3">Period</th>
                <th className="p-3">Gross</th>
                <th className="p-3">Deductions</th>
                <th className="p-3 font-bold">Net</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((slip) => {
                  const gross = slip.grossSalary ?? 0;
                  const ded = slip.totalDeductions ?? 0;
                  const net = slip.netSalary ?? (gross - ded);
                  const period = slip.periodStart && slip.periodEnd
                    ? `${formatDate(slip.periodStart)} – ${formatDate(slip.periodEnd)}`
                    : '—';
                  const isChecked = selectedSlipIds.includes(slip.id);

                  return (
                    <tr
                      key={slip.id}
                      onClick={() => navigate(ROUTES.PAYSLIP_DETAIL(slip.id))}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#714B67]/5' : ''
                      }`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isChecked}
                          onChange={() => toggleSelect(slip.id)}
                        />
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 block leading-tight">{slip.employeeName || 'Employee'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{slip.employeeCode || '—'}</span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Layers className="w-3 h-3 text-[#714B67]" />
                          {slip.salaryStructureName || 'Regular Salary'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{period}</td>
                      <td className="p-3 font-medium text-slate-900">{formatCurrency(gross, 'INR')}</td>
                      <td className="p-3 font-medium text-rose-600">-{formatCurrency(ded, 'INR')}</td>
                      <td className="p-3 font-bold text-emerald-700">{formatCurrency(net, 'INR')}</td>
                      <td className="p-3 text-center">
                        <StatusBadge status={slip.status || 'PAID'} />
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          title="Download PDF"
                          isLoading={downloadingId === slip.id}
                          onClick={(e) => handleDownloadPdf(e, slip.id, slip.slipNumber)}
                        >
                          <FileDown className="w-4 h-4 text-[#714B67]" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No payslips found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Sticky Summary Footer showing Total When Selected (or Total Filtered) */}
            {filtered.length > 0 && (
              <tfoot className="bg-slate-50 font-semibold text-slate-800 border-t-2 border-slate-200 sticky bottom-0 z-10 shadow-xs">
                <tr>
                  <td className="p-3 text-center font-mono text-[10px] text-slate-400">
                    {isAnySelected ? 'SEL' : 'TOTAL'}
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    {isAnySelected ? (
                      <span className="text-[#714B67]">
                        Total Selected ({selectedSlipIds.length} of {filtered.length} payslips)
                      </span>
                    ) : (
                      <span>Total Filtered ({filtered.length} payslips)</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-400">—</td>
                  <td className="p-3 font-mono text-slate-400">—</td>
                  <td className="p-3 font-bold text-slate-900">{formatCurrency(summaryGross, 'INR')}</td>
                  <td className="p-3 font-bold text-rose-600">-{formatCurrency(summaryDeductions, 'INR')}</td>
                  <td className="p-3 font-extrabold text-[#714B67] text-sm">{formatCurrency(summaryNet, 'INR')}</td>
                  <td className="p-3 text-center" colSpan={2}>
                    {isAnySelected && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-[11px] font-semibold text-[#714B67] hover:underline cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Floating Bottom Total Dock when records are selected */}
      {isAnySelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">{selectedSlipIds.length} payslips selected</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-slate-400 mr-1">Gross:</span>
            <span className="font-semibold text-white">{formatCurrency(summaryGross, 'INR')}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-slate-400 mr-1">Deductions:</span>
            <span className="font-semibold text-rose-400">-{formatCurrency(summaryDeductions, 'INR')}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-slate-400 mr-1">Total Net:</span>
            <span className="font-extrabold text-emerald-400 text-sm">{formatCurrency(summaryNet, 'INR')}</span>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors"
          >
            Deselect All
          </button>
        </div>
      )}
    </PageContainer>
  );
}
