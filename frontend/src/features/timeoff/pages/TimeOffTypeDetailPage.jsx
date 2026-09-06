import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeoffApi } from '../api/timeoffApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { useToast } from '../../../hooks/useToast';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { 
  ArrowLeft, Edit3, Save, X, Info, Clock, AlertCircle, Settings2 
} from 'lucide-react';

export function TimeOffTypeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const canManage = can(PERMISSIONS.CAN_MANAGE_SCHEDULES);

  const [isEditing, setIsEditing] = useState(false);

  const { data: type, isLoading, isError, error } = useQuery({
    queryKey: ['timeoff', 'type', id],
    queryFn: () => timeoffApi.getTypeById(id),
    enabled: !!id,
  });

  const [formData, setFormData] = useState({
    name: '',
    unit: 'Days',
    requiresAllocation: true,
    approvalType: 'Manager',
    payrollWorkEntry: 'Leave Work Entry',
    displayColor: 'Blue',
    configurationNotes: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (type) {
      setFormData({
        name: type.name || '',
        unit: type.unit || 'Days',
        requiresAllocation: type.requiresAllocation !== false,
        approvalType: type.approvalType || 'Manager',
        payrollWorkEntry: type.payrollWorkEntry || 'Leave Work Entry',
        displayColor: type.displayColor || 'Blue',
        configurationNotes: type.configurationNotes || '',
        status: type.status || 'ACTIVE',
      });
    }
  }, [type]);

  const updateMutation = useMutation({
    mutationFn: (payload) => timeoffApi.updateType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'type', id] });
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'types'] });
      toast.success('Time Off Type policy updated.');
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update time off type.');
    },
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Type name cannot be empty.');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <PageContainer title="Time Off Type" description="Loading type details...">
        <div className="flex items-center justify-center py-20">
          <Clock className="w-8 h-8 text-[#714B67] animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !type) {
    return (
      <PageContainer title="Time Off Type" description="Type not found">
        <div className="max-w-md mx-auto py-12 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Time Off Type Not Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {error?.response?.data?.message || 'The requested leave policy definition does not exist.'}
          </p>
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.TIMEOFF_TYPES)}>
            Back to Types
          </Button>
        </div>
      </PageContainer>
    );
  }

  const typeName = type.name || 'Leave Type';
  const headerTitle = `Time Off Type / ${typeName}`;

  return (
    <PageContainer
      title={headerTitle}
      description="Form view of one time off type"
      breadcrumbs={[
        { label: 'Time Off', href: ROUTES.TIMEOFF },
        { label: 'Time Off Types', href: ROUTES.TIMEOFF_TYPES },
        { label: typeName },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.TIMEOFF_TYPES)}
          >
            Back
          </Button>

          {canManage && (
            isEditing ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={X}
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  isLoading={updateMutation.isPending}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={Edit3}
                onClick={() => setIsEditing(true)}
              >
                EDIT
              </Button>
            )
          )}
        </div>
      }
    >
      {/* Main Form Card matching Wireframe 6 */}
      <Card className="border border-slate-200 shadow-sm max-w-5xl mx-auto">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header Info Banner */}
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor:
                    (isEditing ? formData.displayColor : type.displayColor)?.toLowerCase() === 'orange'
                      ? '#EA580C'
                      : (isEditing ? formData.displayColor : type.displayColor)?.toLowerCase() === 'green'
                      ? '#16A34A'
                      : '#2563EB',
                }}
              />
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? formData.name : typeName}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <StatusBadge status={isEditing ? formData.status : type.status} />
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Type Name
                </label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900">
                    {typeName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Unit
                </label>
                {isEditing ? (
                  <Select
                    options={[
                      { value: 'Days', label: 'Days' },
                      { value: 'Hours', label: 'Hours' },
                    ]}
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                    {type.unit || 'Days'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Requires Allocation
                </label>
                {isEditing ? (
                  <Select
                    options={[
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                    value={String(formData.requiresAllocation)}
                    onChange={(e) => setFormData({ ...formData, requiresAllocation: e.target.value === 'true' })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                    {type.requiresAllocation !== false ? 'Yes' : 'No'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Active
                </label>
                {isEditing ? (
                  <Select
                    options={[
                      { value: 'ACTIVE', label: 'True' },
                      { value: 'INACTIVE', label: 'False' },
                    ]}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                    {type.status === 'ACTIVE' ? 'True' : 'False'}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Approval
                </label>
                {isEditing ? (
                  <Select
                    options={[
                      { value: 'Manager', label: 'Manager' },
                      { value: 'Officer', label: 'Officer' },
                      { value: 'No Validation', label: 'No Validation' },
                    ]}
                    value={formData.approvalType}
                    onChange={(e) => setFormData({ ...formData, approvalType: e.target.value })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                    {type.approvalType || 'Manager'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payroll / Work Entry
                </label>
                {isEditing ? (
                  <Input
                    value={formData.payrollWorkEntry}
                    onChange={(e) => setFormData({ ...formData, payrollWorkEntry: e.target.value })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                    {type.payrollWorkEntry || 'Leave Work Entry'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Display Color
                </label>
                {isEditing ? (
                  <Select
                    options={[
                      { value: 'Blue', label: 'Blue' },
                      { value: 'Orange', label: 'Orange' },
                      { value: 'Green', label: 'Green' },
                      { value: 'Purple', label: 'Purple' },
                    ]}
                    value={formData.displayColor}
                    onChange={(e) => setFormData({ ...formData, displayColor: e.target.value })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          type.displayColor?.toLowerCase() === 'orange'
                            ? '#EA580C'
                            : type.displayColor?.toLowerCase() === 'green'
                            ? '#16A34A'
                            : '#2563EB',
                      }}
                    />
                    <span>{type.displayColor || 'Blue'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Width Configuration Notes */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Configuration Notes
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                value={formData.configurationNotes}
                onChange={(e) => setFormData({ ...formData, configurationNotes: e.target.value })}
                placeholder="Standard annual leave. Balance comes from approved allocations."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
              />
            ) : (
              <div className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed min-h-[50px]">
                {type.configurationNotes || 'Standard annual leave. Balance comes from approved allocations.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Useful Note Footer matching wireframe specification */}
      <div className="max-w-5xl mx-auto mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium leading-relaxed">
          <strong>Useful note:</strong> Time Off Type drives approval behavior and whether a request needs an allocation.
        </span>
      </div>
    </PageContainer>
  );
}
