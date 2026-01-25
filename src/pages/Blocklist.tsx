import { useState, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Search,
  ShieldBan,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Clock,
  Activity,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useBlockedIPs, useBlockIP, useUnblockIP } from '@/hooks/useSecurityData';
import { useAppContext } from '@/context/AppContext';
import { BlockedIP } from '@/types/security';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const Blocklist = () => {
  const { config } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [newIp, setNewIp] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: blockedIPs, isLoading, refetch } = useBlockedIPs(config.useMockData);
  const blockIP = useBlockIP();
  const unblockIP = useUnblockIP();

  // Filter blocked IPs
  const filteredIPs = useMemo(() => {
    if (!blockedIPs) return [];

    return blockedIPs.filter(ip => {
      const matchesSearch = ip.ip.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesReason = filterReason === 'all' || ip.reason === filterReason;
      return matchesSearch && matchesReason;
    });
  }, [blockedIPs, searchTerm, filterReason]);

  // Stats
  const stats = useMemo(() => {
    if (!blockedIPs) return { total: 0, auto: 0, manual: 0 };
    return {
      total: blockedIPs.length,
      auto: blockedIPs.filter(ip => ip.reason === 'auto').length,
      manual: blockedIPs.filter(ip => ip.reason === 'manual').length,
    };
  }, [blockedIPs]);

  const handleAddIP = async () => {
    // Validate IP/hostname format (more flexible for manual blocks)
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::ffff:/;
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-_\.]*[a-zA-Z0-9])?$|^[a-zA-Z0-9]$/;
    
    const trimmedIp = newIp.trim();
    
    if (!trimmedIp) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter an IP address or hostname.',
        variant: 'destructive',
      });
      return;
    }

    const isValid = 
      ipv4Regex.test(trimmedIp) || 
      ipv6Regex.test(trimmedIp) || 
      (hostnameRegex.test(trimmedIp) && trimmedIp.length <= 253);

    if (!isValid) {
      toast({
        title: 'Invalid Format',
        description: 'Please enter a valid IPv4 address, IPv6 address, or hostname (e.g., 192.168.1.100 or test-client).',
        variant: 'destructive',
      });
      return;
    }

    // Check if already blocked
    if (blockedIPs?.some(ip => ip.ip === trimmedIp)) {
      toast({
        title: 'Already Blocked',
        description: 'This IP address or hostname is already in the blocklist.',
        variant: 'destructive',
      });
      return;
    }

    blockIP.mutate({ ip: trimmedIp, useMock: config.useMockData });
    setNewIp('');
    setIsAddDialogOpen(false);
  };

  const handleUnblock = (ip: string) => {
    unblockIP.mutate({ ip, useMock: config.useMockData });
  };

  const exportBlocklist = () => {
    if (!blockedIPs || blockedIPs.length === 0) {
      toast({
        title: 'No Data',
        description: 'No blocked IPs to export.',
        variant: 'destructive',
      });
      return;
    }

    const csvContent = [
      'IP Address,Blocked At,Reason,Related Events',
      ...blockedIPs.map(ip => 
        `${ip.ip},${ip.blocked_at},${ip.reason},${ip.related_events}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blocklist_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Blocklist exported successfully.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blocklist Management</h1>
          <p className="text-muted-foreground">
            Manage blocked IP addresses and access controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportBlocklist} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Block IP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block IP Address</DialogTitle>
                <DialogDescription>
                  Add an IP address to the blocklist. This will prevent all requests from this IP.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">IP Address or Hostname</label>
                  <Input
                    placeholder="e.g., 192.168.1.100 or test-client"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddIP()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports IPv4, IPv6, or hostname identifiers
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddIP} disabled={blockIP.isPending}>
                  {blockIP.isPending ? 'Blocking...' : 'Block IP'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-destructive/10 p-3">
                <ShieldBan className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Blocked</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto-Blocked</p>
                <p className="text-2xl font-bold">{stats.auto}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Manual Blocks</p>
                <p className="text-2xl font-bold">{stats.manual}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search IP addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterReason} onValueChange={setFilterReason}>
                <SelectTrigger className="w-[150px] bg-secondary/30">
                  <SelectValue placeholder="Filter by reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="auto">Auto-Blocked</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocklist Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldBan className="h-5 w-5 text-destructive" />
            Blocked IP Addresses
          </CardTitle>
          <CardDescription>
            {filteredIPs.length} IP{filteredIPs.length !== 1 ? 's' : ''} in blocklist
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-10" />
                </div>
              ))}
            </div>
          ) : filteredIPs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldCheck className="h-12 w-12 text-success mb-4" />
              <p className="text-lg font-medium text-foreground">No Blocked IPs</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || filterReason !== 'all' 
                  ? 'No IPs match your search criteria'
                  : 'All IP addresses are currently allowed'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>IP Address</TableHead>
                    <TableHead>Blocked At</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Related Events</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIPs.map((blocked) => (
                    <TableRow key={blocked.ip} className="hover:bg-muted/30">
                      <TableCell>
                        <code className="font-mono text-sm bg-secondary/50 px-2 py-1 rounded">
                          {blocked.ip}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(blocked.blocked_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(blocked.blocked_at), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={blocked.reason === 'auto' ? 'destructive' : 'secondary'}
                          className={cn(
                            blocked.reason === 'auto' && 'bg-warning text-warning-foreground'
                          )}
                        >
                          {blocked.reason === 'auto' ? 'Auto-Blocked' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>{blocked.related_events} event{blocked.related_events !== 1 ? 's' : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              Unblock
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Unblock IP Address?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to unblock <strong>{blocked.ip}</strong>? 
                                This will allow traffic from this IP address again.
                                {blocked.related_events > 0 && (
                                  <span className="block mt-2 text-warning">
                                    ⚠️ This IP has {blocked.related_events} related security event{blocked.related_events !== 1 ? 's' : ''}.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleUnblock(blocked.ip)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Unblock
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">About IP Blocking</p>
              <p className="text-xs text-muted-foreground">
                <strong>Auto-Blocked:</strong> IPs automatically blocked by the AI detection system when high-confidence threats are detected.
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Manual:</strong> IPs manually added to the blocklist by administrators.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Blocked IPs are prevented from making requests to your protected endpoints. Use caution when unblocking IPs with high-severity events.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Blocklist;
