import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SecurityEvent } from '@/types/security';
import { getEventTimeSeriesData } from '@/services/api';

interface ThreatChartProps {
  events?: SecurityEvent[];
  isLoading: boolean;
}

const COLORS = {
  xss: 'hsl(0, 84%, 60%)',
  sqli: 'hsl(38, 92%, 50%)',
  benign: 'hsl(142, 76%, 36%)',
};

export const ThreatChart = ({ events, isLoading }: ThreatChartProps) => {
  const timeSeriesData = events ? getEventTimeSeriesData(events) : [];

  // Calculate distribution data
  // An event is benign if both XSS and SQLi are benign (or is_malicious is false)
  // Otherwise, it's malicious and categorized by top_threat
  const distributionData = events?.reduce(
    (acc, event) => {
      // Check if event is benign: both XSS and SQLi are benign, or is_malicious is explicitly false
      const isBenign = event.is_malicious === false || 
                       (event.xss.label === 'benign' && event.sqli.label === 'benign');
      
      if (isBenign) {
        acc.benign++;
      } else if (event.top_threat === 'xss') {
        acc.xss++;
      } else {
        acc.sqli++;
      }
      return acc;
    },
    { xss: 0, sqli: 0, benign: 0 }
  ) ?? { xss: 0, sqli: 0, benign: 0 };

  const pieData = [
    { name: 'XSS', value: distributionData.xss, color: COLORS.xss },
    { name: 'SQLi', value: distributionData.sqli, color: COLORS.sqli },
    { name: 'Benign', value: distributionData.benign, color: COLORS.benign },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Area Chart */}
      <Card className="glass-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Threat Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="xssGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.xss} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.xss} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sqliGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.sqli} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.sqli} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="benignGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.benign} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.benign} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis 
                dataKey="hour" 
                className="text-xs fill-muted-foreground" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
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
              <Area
                type="monotone"
                dataKey="xss"
                stackId="1"
                stroke={COLORS.xss}
                fill="url(#xssGradient)"
                name="XSS"
              />
              <Area
                type="monotone"
                dataKey="sqli"
                stackId="1"
                stroke={COLORS.sqli}
                fill="url(#sqliGradient)"
                name="SQLi"
              />
              <Area
                type="monotone"
                dataKey="benign"
                stackId="1"
                stroke={COLORS.benign}
                fill="url(#benignGradient)"
                name="Benign"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Threat Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
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
              <Legend 
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
