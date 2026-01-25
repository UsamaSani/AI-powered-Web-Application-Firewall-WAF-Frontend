import { format } from 'date-fns';
import { Copy, ShieldBan, ShieldCheck, RotateCcw, AlertTriangle, Flag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SecurityEvent } from '@/types/security';
import { useBlockIP, useUnblockIP, useUndoAction, useMarkFalsePositive } from '@/hooks/useSecurityData';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EventDetailModalProps {
  event: SecurityEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConfidenceGauge = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className={cn('text-sm font-bold', color)}>{(value * 100).toFixed(2)}%</span>
    </div>
    <Progress 
      value={value * 100} 
      className={cn('h-3', value > 0.8 ? 'bg-destructive/20' : value > 0.5 ? 'bg-warning/20' : 'bg-success/20')}
    />
  </div>
);

export const EventDetailModal = ({ event, open, onOpenChange }: EventDetailModalProps) => {
  const { config } = useAppContext();
  const { toast } = useToast();
  const blockIP = useBlockIP();
  const unblockIP = useUnblockIP();
  const undoAction = useUndoAction();
  const markFalsePositive = useMarkFalsePositive();

  if (!event) return null;

  const copyPayload = () => {
    navigator.clipboard.writeText(event.payload);
    toast({
      title: 'Copied',
      description: 'Payload copied to clipboard',
    });
  };

  const getActionLabel = (action: SecurityEvent['action']) => {
    switch (action) {
      case 'auto_block_temp':
        return { label: 'Auto Blocked', color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'alert':
        return { label: 'Alert Raised', color: 'text-warning', bg: 'bg-warning/10' };
      case 'monitor':
        return { label: 'Monitoring', color: 'text-success', bg: 'bg-success/10' };
    }
  };

  const actionInfo = getActionLabel(event.action);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] glass-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn('rounded-lg p-2', actionInfo.bg)}>
              <AlertTriangle className={cn('h-5 w-5', actionInfo.color)} />
            </div>
            <div>
              <span className="text-lg">Event Details</span>
              <Badge variant="outline" className="ml-2">{event._id}</Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Detected {format(new Date(event.created_at), 'PPpp')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">IP Address</p>
                <code className="font-mono text-lg font-bold">{event.ip}</code>
              </div>
              <div className="rounded-lg bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Path</p>
                <code className="font-mono text-sm text-foreground break-all">{event.path}</code>
              </div>
            </div>

            {/* Threat Analysis */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-4 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Threat Analysis
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <ConfidenceGauge 
                  label="XSS Detection" 
                  value={event.xss.confidence}
                  color={event.xss.confidence > 0.8 ? 'text-destructive' : event.xss.confidence > 0.5 ? 'text-warning' : 'text-success'}
                />
                <ConfidenceGauge 
                  label="SQLi Detection" 
                  value={event.sqli.confidence}
                  color={event.sqli.confidence > 0.8 ? 'text-destructive' : event.sqli.confidence > 0.5 ? 'text-warning' : 'text-success'}
                />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Top Threat:</span>
                <Badge variant={event.confidence > 0.8 ? 'destructive' : 'secondary'}>
                  {event.top_threat.toUpperCase()} ({(event.confidence * 100).toFixed(1)}%)
                </Badge>
                <Badge className={cn(actionInfo.bg, actionInfo.color, 'ml-auto')}>
                  {actionInfo.label}
                </Badge>
              </div>
            </div>

            {/* Payload */}
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Payload</h3>
                <Button variant="ghost" size="sm" onClick={copyPayload} className="gap-2">
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <pre className="rounded-lg bg-background p-4 overflow-x-auto text-sm font-mono text-destructive">
                {event.payload}
              </pre>
            </div>

            {/* Headers */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-2 font-semibold">Request Headers</h3>
              <div className="space-y-1">
                {Object.entries(event.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">{key}:</span>
                    <span className="text-foreground break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Explanation */}
            {(event.xss.explanation || event.sqli.explanation) && (
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-2 font-semibold">Detection Explanation</h3>
                <div className="space-y-2 text-sm">
                  {event.xss.confidence > 0.5 && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="border-destructive text-destructive shrink-0">XSS</Badge>
                      <span className="text-muted-foreground">
                        Pattern: {JSON.stringify(event.xss.explanation)}
                      </span>
                    </div>
                  )}
                  {event.sqli.confidence > 0.5 && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="border-warning text-warning shrink-0">SQLi</Badge>
                      <span className="text-muted-foreground">
                        Pattern: {JSON.stringify(event.sqli.explanation)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator className="my-2" />

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => blockIP.mutate({ ip: event.ip, useMock: config.useMockData })}
            className="gap-2"
          >
            <ShieldBan className="h-4 w-4" />
            Block IP
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => unblockIP.mutate({ ip: event.ip, useMock: config.useMockData })}
            className="gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            Unblock IP
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => undoAction.mutate({ eventId: event._id, useMock: config.useMockData })}
            disabled={event.status === 'undone'}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Undo Action
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markFalsePositive.mutate({ eventId: event._id, useMock: config.useMockData })}
            disabled={event.false_positive || markFalsePositive.isPending}
            className="gap-2 ml-auto"
          >
            <Flag className={cn("h-4 w-4", event.false_positive && "text-success")} />
            {event.false_positive ? 'False Positive' : 'Mark False Positive'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
