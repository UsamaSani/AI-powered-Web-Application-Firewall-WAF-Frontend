import { ArrowUpRight, ArrowDownRight, Shield, ShieldAlert, ShieldBan, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStats } from '@/types/security';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  isLoading?: boolean;
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  variant = 'default',
  isLoading 
}: StatCardProps) => {
  const variantStyles = {
    default: 'border-border/50',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    destructive: 'border-destructive/30 bg-destructive/5',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-4 h-8 w-24" />
          <Skeleton className="mt-2 h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('glass-card transition-all hover:scale-[1.02]', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn('rounded-lg p-2.5', iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && trendValue && (
            <div className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const StatsCards = ({ stats, isLoading }: StatsCardsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Events Today"
        value={stats?.total_events_today ?? 0}
        icon={Activity}
        trend="up"
        trendValue="+12%"
        isLoading={isLoading}
      />
      <StatCard
        title="Active Blocks"
        value={stats?.active_blocks ?? 0}
        icon={ShieldBan}
        variant="destructive"
        subtitle="IPs currently blocked"
        isLoading={isLoading}
      />
      <StatCard
        title="Threats Detected"
        value={(stats?.threats_detected.xss ?? 0) + (stats?.threats_detected.sqli ?? 0)}
        icon={ShieldAlert}
        variant="warning"
        subtitle={`XSS: ${stats?.threats_detected.xss ?? 0} | SQLi: ${stats?.threats_detected.sqli ?? 0}`}
        isLoading={isLoading}
      />
      <StatCard
        title="Alert Rate"
        value={`${(stats?.alert_rate ?? 0).toFixed(1)}%`}
        icon={Shield}
        variant="success"
        subtitle="Of total requests"
        isLoading={isLoading}
      />
    </div>
  );
};
