import { useState } from 'react';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ThreatChart } from '@/components/dashboard/ThreatChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { EventDetailModal } from '@/components/events/EventDetailModal';
import { useDashboardStats, useEvents } from '@/hooks/useSecurityData';
import { useAppContext } from '@/context/AppContext';
import { SecurityEvent } from '@/types/security';

const Dashboard = () => {
  const { config } = useAppContext();
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const { data: stats, isLoading: statsLoading } = useDashboardStats(
    config.autoRefresh,
    config.useMockData
  );

  const { data: events, isLoading: eventsLoading } = useEvents(
    undefined,
    100,
    config.autoRefresh,
    config.useMockData
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Security Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time AI-powered threat detection and monitoring
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={statsLoading} />

      {/* Charts */}
      <ThreatChart events={events} isLoading={eventsLoading} />

      {/* Activity Feed */}
      <ActivityFeed 
        events={events} 
        isLoading={eventsLoading}
        onEventClick={setSelectedEvent}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </div>
  );
};

export default Dashboard;
