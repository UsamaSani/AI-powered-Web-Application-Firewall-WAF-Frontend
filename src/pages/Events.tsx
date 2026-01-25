import { useState, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  Eye,
  ShieldBan,
  ShieldCheck,
  RotateCcw,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EventDetailModal } from '@/components/events/EventDetailModal';
import { useEvents, useBlockIP, useUnblockIP, useUndoAction } from '@/hooks/useSecurityData';
import { useAppContext } from '@/context/AppContext';
import { SecurityEvent, EventFilters } from '@/types/security';
import { cn } from '@/lib/utils';

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'bg-destructive';
  if (confidence >= 0.7) return 'bg-warning';
  if (confidence >= 0.5) return 'bg-primary';
  return 'bg-success';
};

const getThreatBadge = (threat: SecurityEvent['top_threat'], confidence: number) => {
  if (confidence < 0.5) {
    return <Badge variant="outline" className="border-success text-success">Benign</Badge>;
  }
  if (threat === 'xss') {
    return <Badge variant="outline" className="border-destructive text-destructive">XSS</Badge>;
  }
  return <Badge variant="outline" className="border-warning text-warning">SQLi</Badge>;
};

const getActionBadge = (action: SecurityEvent['action']) => {
  switch (action) {
    case 'auto_block_temp':
      return <Badge variant="destructive">Auto Block</Badge>;
    case 'alert':
      return <Badge className="bg-warning text-warning-foreground">Alert</Badge>;
    case 'monitor':
      return <Badge variant="secondary">Monitor</Badge>;
  }
};

const Events = () => {
  const { config } = useAppContext();
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: events, isLoading } = useEvents(
    filters,
    100,
    config.autoRefresh,
    config.useMockData
  );

  const blockIP = useBlockIP();
  const unblockIP = useUnblockIP();
  const undoAction = useUndoAction();

  // Filter and paginate events
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      if (searchTerm && !event.ip.includes(searchTerm) && !event.path.includes(searchTerm)) {
        return false;
      }
      return true;
    });
  }, [events, searchTerm]);

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  const handleExportCSV = () => {
    if (!events) return;
    
    const headers = ['Timestamp', 'IP', 'Path', 'Threat', 'Confidence', 'Action', 'Status'];
    const rows = events.map(e => [
      format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss'),
      e.ip,
      e.path,
      e.top_threat.toUpperCase(),
      `${(e.confidence * 100).toFixed(2)}%`,
      e.action,
      e.status
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-events-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm || filters.threatType || filters.action || filters.ip;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Security Events</h1>
          <p className="text-muted-foreground">
            Browse and manage detected security events
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by IP or path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary/50"
              />
            </div>

            {/* Threat Type Filter */}
            <Select 
              value={filters.threatType || ''} 
              onValueChange={(v) => setFilters(prev => ({ ...prev, threatType: v as EventFilters['threatType'] }))}
            >
              <SelectTrigger className="w-[140px] bg-secondary/50">
                <SelectValue placeholder="Threat Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xss">XSS</SelectItem>
                <SelectItem value="sqli">SQLi</SelectItem>
                <SelectItem value="benign">Benign</SelectItem>
              </SelectContent>
            </Select>

            {/* Action Filter */}
            <Select 
              value={filters.action || ''} 
              onValueChange={(v) => setFilters(prev => ({ ...prev, action: v as EventFilters['action'] }))}
            >
              <SelectTrigger className="w-[140px] bg-secondary/50">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="auto_block_temp">Auto Block</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            Events ({filteredEvents.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(v) => { setItemsPerPage(Number(v)); setPage(1); }}
            >
              <SelectTrigger className="w-[70px] bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="font-semibold">Timestamp</TableHead>
                      <TableHead className="font-semibold">IP Address</TableHead>
                      <TableHead className="font-semibold">Path</TableHead>
                      <TableHead className="font-semibold">Threat</TableHead>
                      <TableHead className="font-semibold">Confidence</TableHead>
                      <TableHead className="font-semibold">Action</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEvents.map((event) => (
                      <TableRow 
                        key={event._id}
                        className={cn(
                          'cursor-pointer transition-colors',
                          event.status === 'undone' && 'opacity-50',
                          event.false_positive && 'bg-success/5 border-l-2 border-l-success'
                        )}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span>{format(new Date(event.created_at), 'HH:mm:ss')}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-sm">{event.ip}</code>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs text-muted-foreground">{event.path}</code>
                        </TableCell>
                        <TableCell>{getThreatBadge(event.top_threat, event.confidence)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress 
                              value={event.confidence * 100} 
                              className={cn('h-2 w-16', getConfidenceColor(event.confidence))}
                            />
                            <span className="text-xs font-medium">
                              {(event.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(event.action)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                              {event.status}
                            </Badge>
                            {event.false_positive && (
                              <Badge variant="outline" className="border-success text-success">
                                False Positive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  blockIP.mutate({ ip: event.ip, useMock: config.useMockData }); 
                                }}
                              >
                                <ShieldBan className="mr-2 h-4 w-4" />
                                Block IP
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  unblockIP.mutate({ ip: event.ip, useMock: config.useMockData }); 
                                }}
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Unblock IP
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  undoAction.mutate({ eventId: event._id, useMock: config.useMockData }); 
                                }}
                                disabled={event.status === 'undone'}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Undo Action
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredEvents.length)} of {filteredEvents.length} events
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </div>
  );
};

export default Events;
