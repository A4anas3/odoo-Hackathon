import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { StatCard } from '../../dashboard/components/StatCard';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/modal/Modal';
import { FormField } from '../../../components/form/FormField';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { timeoffApi, DEFAULT_LEAVE_REQUESTS } from '../api/timeoffApi';
import { useToast } from '../../../hooks/useToast';
import { Calendar, Plus, CheckCircle2, Clock, CalendarDays, Plane } from 'lucide-react';
import { formatDate } from '../../../lib/utils/formatters';

export function TimeOffPage() {
  const toast = useToast();
  const [requests, setRequests] = useState(DEFAULT_LEAVE_REQUESTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleRequest = async () => {
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    const created = await timeoffApi.submitRequest({
      ...formData,
      durationDays: 3,
    });
    setRequests([created, ...requests]);
    setIsModalOpen(false);
    setFormData({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' });
    toast.success('Leave application submitted for supervisor approval.');
  };

  const columns = [
    {
      header: 'Employee',
      key: 'employee',
      render: (emp) => (
        <div>
          <span className="font-semibold text-slate-800 block leading-tight">{emp?.name}</span>
          <span className="text-[10px] text-slate-400">{emp?.department}</span>
        </div>
      ),
    },
    {
      header: 'Leave Type',
      key: 'type',
      render: (type) => <span className="font-medium text-slate-700">{type}</span>,
    },
    {
      header: 'Start Date',
      key: 'startDate',
      render: (date) => <span className="text-slate-600">{formatDate(date)}</span>,
    },
    {
      header: 'End Date',
      key: 'endDate',
      render: (date) => <span className="text-slate-600">{formatDate(date)}</span>,
    },
    {
      header: 'Duration',
      key: 'durationDays',
      render: (days) => (
        <span className="font-semibold text-slate-800">{days} {days === 1 ? 'day' : 'days'}</span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
  ];

  return (
    <PageContainer
      title="Time Off & Leaves"
      description="Manage vacation days, sick leaves, allocations, and approval queues."
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Request Time Off
        </Button>
      }
    >
      {/* 4 Allocation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Annual Leave"
          value="14 / 20 Days"
          subtitle="Remaining balance"
          icon={Plane}
        />
        <StatCard
          title="Sick Leave"
          value="8 / 10 Days"
          subtitle="Medical allowance"
          icon={Calendar}
        />
        <StatCard
          title="Pending Requests"
          value="2 Requests"
          subtitle="Awaiting review"
          icon={Clock}
          trend="Action required"
        />
        <StatCard
          title="Approved This Year"
          value="11 Days"
          subtitle="Utilized so far"
          icon={CheckCircle2}
        />
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader
          title="Recent Leave Requests"
          subtitle="History of time off submissions and decision logs"
        />
        <DataTable columns={columns} data={requests} />
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Time Off"
        subtitle="Submit your leave application for approval"
      >
        <div className="space-y-4">
          <FormField label="Leave Type" required>
            <Select
              options={['Annual Leave', 'Sick Leave', 'Casual Leave', 'Unpaid Leave']}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </FormField>
            <FormField label="End Date" required>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Reason / Notes">
            <Input
              placeholder="e.g. Vacation, urgent personal errand"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRequest}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
