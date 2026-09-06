import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/employeeApi';
import { useToast } from '../../../hooks/useToast';

export const employeesKeys = {
  all: ['employees'],
  lists: () => ['employees', 'list'],
  list: (filters) => ['employees', 'list', filters],
  detail: (id) => ['employees', 'detail', id],
  me: () => ['employees', 'me'],
};

export function useEmployees(filters = {}) {
  return useQuery({
    queryKey: employeesKeys.list(filters),
    queryFn: () => employeeApi.getEmployees({ unpaged: true }),
    select: (employees) => {
      let filtered = [...employees];
      if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.firstName?.toLowerCase().includes(query) ||
            e.lastName?.toLowerCase().includes(query) ||
            e.email?.toLowerCase().includes(query) ||
            e.employeeCode?.toLowerCase().includes(query)
        );
      }
      if (filters.department && filters.department !== 'ALL') {
        filtered = filtered.filter((e) => (e.departmentName || e.department?.name) === filters.department);
      }
      if (filters.status && filters.status !== 'ALL') {
        filtered = filtered.filter((e) => e.status === filters.status);
      }
      if (filters.type && filters.type !== 'ALL') {
        filtered = filtered.filter((e) => e.employeeType === filters.type);
      }
      return filtered;
    },
  });
}

export function useEmployeesPaged({ page = 0, size = 12, search = '', department = 'ALL', status = 'ALL', type = 'ALL' } = {}) {
  return useQuery({
    queryKey: ['employees', 'paged', { page, size, search, department, status, type }],
    queryFn: () => employeeApi.getEmployeesPaged({
      page,
      size,
      search: search?.trim() || undefined,
      department: department !== 'ALL' ? department : undefined,
      status: status !== 'ALL' ? status : undefined,
      type: type !== 'ALL' ? type : undefined,
      sort: 'createdAt,desc',
    }),
    placeholderData: (previousData) => previousData,
  });
}

export function useEmployee(id) {
  return useQuery({
    queryKey: employeesKeys.detail(id),
    queryFn: () => employeeApi.getEmployeeById(id),
    enabled: !!id,
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: employeesKeys.me(),
    queryFn: () => employeeApi.getMyProfile(),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data) => employeeApi.createEmployee(data),
    onSuccess: (newEmployee) => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      toast.success(`Employee ${newEmployee.firstName} ${newEmployee.lastName} created successfully.`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create employee profile.');
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => employeeApi.updateEmployee(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      toast.success(`Employee ${updated.firstName} updated successfully.`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update employee.');
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => employeeApi.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      toast.success('Employee profile deleted.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete employee.');
    },
  });
}
