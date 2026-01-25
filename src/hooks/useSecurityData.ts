import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchEvents, 
  fetchDashboardStats, 
  fetchBlockedIPs, 
  blockIP, 
  unblockIP, 
  undoEventAction,
  markFalsePositive,
  checkApiHealth,
  fetchAnalytics
} from '@/services/api';
import { EventFilters } from '@/types/security';
import { useToast } from '@/hooks/use-toast';

export const useApiHealth = () => {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiHealth,
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000,
  });
};

export const useEvents = (
  filters?: EventFilters, 
  limit: number = 50, 
  autoRefresh: boolean = false,
  useMock: boolean = true
) => {
  return useQuery({
    queryKey: ['events', filters, limit, useMock],
    queryFn: () => fetchEvents(filters, limit, useMock),
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 2000,
  });
};

export const useDashboardStats = (autoRefresh: boolean = false, useMock: boolean = true) => {
  return useQuery({
    queryKey: ['dashboard-stats', useMock],
    queryFn: () => fetchDashboardStats(useMock),
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 2000,
  });
};

export const useBlockedIPs = (useMock: boolean = true) => {
  return useQuery({
    queryKey: ['blocked-ips', useMock],
    queryFn: () => fetchBlockedIPs(useMock),
    staleTime: 5000,
  });
};

export const useBlockIP = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ ip, useMock }: { ip: string; useMock: boolean }) => blockIP(ip, useMock),
    onSuccess: (_, { ip }) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'IP Blocked',
        description: `${ip} has been added to the blocklist.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to block IP address.',
        variant: 'destructive',
      });
    },
  });
};

export const useUnblockIP = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ ip, useMock }: { ip: string; useMock: boolean }) => unblockIP(ip, useMock),
    onSuccess: (_, { ip }) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      toast({
        title: 'IP Unblocked',
        description: `${ip} has been removed from the blocklist.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to unblock IP address.',
        variant: 'destructive',
      });
    },
  });
};

export const useUndoAction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ eventId, useMock }: { eventId: string; useMock: boolean }) => undoEventAction(eventId, useMock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Action Undone',
        description: 'The event action has been reversed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to undo action.',
        variant: 'destructive',
      });
    },
  });
};

export const useMarkFalsePositive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ eventId, useMock }: { eventId: string; useMock: boolean }) => markFalsePositive(eventId, useMock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({
        title: 'Marked as False Positive',
        description: 'The event has been marked as a false positive. If the IP was auto-blocked, it has been unblocked.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to mark as false positive.',
        variant: 'destructive',
      });
    },
  });
};

export const useAnalytics = (useMock: boolean = false) => {
  return useQuery({
    queryKey: ['analytics', useMock],
    queryFn: () => fetchAnalytics(useMock),
    staleTime: 10000,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
