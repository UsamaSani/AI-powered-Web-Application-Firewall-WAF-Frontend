import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Shield, ShieldX, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SecurityEvent } from '@/types/security';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  events?: SecurityEvent[];
  isLoading: boolean;
  onEventClick?: (event: SecurityEvent) => void;
}

const getActionBadge = (action: SecurityEvent['action']) => {
  switch (action) {
    case 'auto_block_temp':
      return <Badge variant="destructive" className="text-xs">Blocked</Badge>;
    case 'alert':
      return <Badge className="bg-warning text-warning-foreground text-xs">Alert</Badge>;
    case 'monitor':
      return <Badge variant="secondary" className="text-xs">Monitor</Badge>;
  }
};

const getActionIcon = (action: SecurityEvent['action']) => {
  switch (action) {
    case 'auto_block_temp':
      return <ShieldX className="h-4 w-4 text-destructive" />;
    case 'alert':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'monitor':
      return <Shield className="h-4 w-4 text-success" />;
  }
};

const getThreatBadge = (threat: SecurityEvent['top_threat'], confidence: number) => {
  if (confidence < 0.5) {
    return <Badge variant="outline" className="text-xs border-success text-success">Benign</Badge>;
  }
  
  if (threat === 'xss') {
    return <Badge variant="outline" className="text-xs border-destructive text-destructive">XSS</Badge>;
  }
  return <Badge variant="outline" className="text-xs border-warning text-warning">SQLi</Badge>;
};

export const ActivityFeed = ({ events, isLoading, onEventClick }: ActivityFeedProps) => {
  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Live Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentEvents = events?.slice(0, 10) ?? [];

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Live Activity</CardTitle>
        <Badge variant="secondary" className="text-xs">
          {events?.length ?? 0} events
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4 custom-scrollbar">
          <div className="space-y-3">
            {recentEvents.map((event, index) => (
              <div
                key={event._id}
                className={cn(
                  'group flex items-center gap-4 rounded-lg border border-border/50 bg-secondary/30 p-3',
                  'cursor-pointer transition-all hover:bg-secondary/50 hover:border-border',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onEventClick?.(event)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/50">
                  {getActionIcon(event.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm text-foreground">{event.ip}</code>
                    {getThreatBadge(event.top_threat, event.confidence)}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {event.path} • {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {getActionBadge(event.action)}
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
