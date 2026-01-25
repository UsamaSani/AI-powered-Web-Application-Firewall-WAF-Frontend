import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useSecurityData';
import { useAppContext } from '@/context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Shield, 
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

const COLORS = {
  xss: 'hsl(0, 84%, 60%)',
  sqli: 'hsl(38, 92%, 50%)',
  benign: 'hsl(142, 76%, 36%)',
  monitor: 'hsl(217, 91%, 60%)',
  alert: 'hsl(38, 92%, 50%)',
  auto_block: 'hsl(0, 84%, 60%)',
};

const Analytics = () => {
  const { config } = useAppContext();
  // Always use real data for analytics, never mock
  const { data: analytics, isLoading } = useAnalytics(false);

  const modelPerformanceCards = useMemo(() => {
    if (!analytics) return [];
    
    const { overall, xss, sqli } = analytics.model_performance;
    
    return [
      {
        title: 'Overall Model',
        metrics: overall,
        icon: Shield,
        color: 'text-primary'
      },
      {
        title: 'XSS Detector',
        metrics: xss,
        icon: AlertTriangle,
        color: 'text-destructive'
      },
      {
        title: 'SQLi Detector',
        metrics: sqli,
        icon: Target,
        color: 'text-warning'
      }
    ];
  }, [analytics]);

  const detectionStatsCards = useMemo(() => {
    if (!analytics) return [];
    
    const stats = analytics.detection_stats;
    const accuracy = stats.total_events > 0 
      ? ((stats.true_positives + stats.true_negatives) / stats.total_events * 100).toFixed(2)
      : '0.00';
    
    return [
      {
        title: 'Total Events',
        value: stats.total_events.toLocaleString(),
        icon: Activity,
        color: 'text-primary'
      },
      {
        title: 'True Positives',
        value: stats.true_positives.toLocaleString(),
        icon: CheckCircle,
        color: 'text-success',
        subtitle: 'Correctly identified threats'
      },
      {
        title: 'True Negatives',
        value: stats.true_negatives.toLocaleString(),
        icon: CheckCircle,
        color: 'text-success',
        subtitle: 'Correctly identified benign'
      },
      {
        title: 'False Positives',
        value: stats.false_positives.toLocaleString(),
        icon: XCircle,
        color: 'text-warning',
        subtitle: 'Incorrectly flagged as threat'
      },
      {
        title: 'False Negatives',
        value: stats.false_negatives.toLocaleString(),
        icon: XCircle,
        color: 'text-destructive',
        subtitle: 'Missed threats'
      },
      {
        title: 'Accuracy',
        value: `${accuracy}%`,
        icon: Target,
        color: 'text-primary',
        subtitle: 'Overall detection accuracy'
      }
    ];
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive security analytics and model performance</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive security analytics and model performance</p>
        </div>
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const performanceChartData = [
    {
      name: 'Overall',
      accuracy: analytics.model_performance.overall.accuracy,
      precision: analytics.model_performance.overall.precision,
      recall: analytics.model_performance.overall.recall,
      f1: analytics.model_performance.overall.f1_score
    },
    {
      name: 'XSS',
      accuracy: analytics.model_performance.xss.accuracy,
      precision: analytics.model_performance.xss.precision,
      recall: analytics.model_performance.xss.recall,
      f1: analytics.model_performance.xss.f1_score
    },
    {
      name: 'SQLi',
      accuracy: analytics.model_performance.sqli.accuracy,
      precision: analytics.model_performance.sqli.precision,
      recall: analytics.model_performance.sqli.recall,
      f1: analytics.model_performance.sqli.f1_score
    }
  ];

  const actionDistributionData = [
    { name: 'Monitor', value: analytics.action_distribution.monitor, color: COLORS.monitor },
    { name: 'Alert', value: analytics.action_distribution.alert, color: COLORS.alert },
    { name: 'Auto Block', value: analytics.action_distribution.auto_block_temp, color: COLORS.auto_block }
  ];

  const threatBreakdownData = [
    { name: 'XSS', value: analytics.threat_breakdown.xss, color: COLORS.xss },
    { name: 'SQLi', value: analytics.threat_breakdown.sqli, color: COLORS.sqli },
    { name: 'Benign', value: analytics.threat_breakdown.benign, color: COLORS.benign }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive security analytics and model performance metrics
        </p>
      </div>

      {/* Model Performance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {modelPerformanceCards.map((card, idx) => {
          const Icon = card.icon;
          const metrics = card.metrics;
          return (
            <Card key={idx} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Accuracy</span>
                    <span className="text-lg font-bold">{metrics.accuracy}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Precision</span>
                    <span className="text-sm font-semibold">{metrics.precision}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Recall</span>
                    <span className="text-sm font-semibold">{metrics.recall}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">F1-Score</span>
                    <span className="text-sm font-semibold">{metrics.f1_score}%</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {metrics.total_predictions.toLocaleString()} predictions
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detection Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {detectionStatsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg bg-primary/10 p-3 ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Model Performance Comparison */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Model Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  itemStyle={{
                    color: 'hsl(var(--foreground))'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontWeight: 500
                  }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Legend />
                <Bar dataKey="accuracy" fill={COLORS.xss} name="Accuracy" />
                <Bar dataKey="precision" fill={COLORS.sqli} name="Precision" />
                <Bar dataKey="recall" fill={COLORS.benign} name="Recall" />
                <Bar dataKey="f1" fill={COLORS.monitor} name="F1-Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Threat Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Threat Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threatBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    padding: '8px 12px'
                  }}
                  itemStyle={{
                    color: 'hsl(var(--foreground))',
                    padding: '4px 0'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Action Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {actionDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    padding: '8px 12px'
                  }}
                  itemStyle={{
                    color: 'hsl(var(--foreground))',
                    padding: '4px 0'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Confidence Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.confidence_distribution.overall}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="bucket" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    padding: '8px 12px'
                  }}
                  itemStyle={{
                    color: 'hsl(var(--foreground))',
                    padding: '4px 0'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}
                />
                <Bar dataKey="count" fill={COLORS.monitor} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      {analytics.time_series && analytics.time_series.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Threat Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analytics.time_series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    padding: '8px 12px'
                  }}
                  itemStyle={{
                    color: 'hsl(var(--foreground))',
                    padding: '4px 0'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="xss" 
                  stroke={COLORS.xss} 
                  strokeWidth={2}
                  name="XSS"
                />
                <Line 
                  type="monotone" 
                  dataKey="sqli" 
                  stroke={COLORS.sqli} 
                  strokeWidth={2}
                  name="SQLi"
                />
                <Line 
                  type="monotone" 
                  dataKey="benign" 
                  stroke={COLORS.benign} 
                  strokeWidth={2}
                  name="Benign"
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke={COLORS.monitor} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top IPs Table */}
      {analytics.top_ips && analytics.top_ips.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top IP Addresses by Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.top_ips.map((ipData, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <code className="font-mono text-sm font-semibold">{ipData.ip}</code>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        {ipData.malicious} malicious
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {ipData.benign} benign
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {ipData.count} total events
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
