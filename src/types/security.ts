export interface ThreatAnalysis {
  label: 'malicious' | 'benign';
  confidence: number;
  explanation: Record<string, unknown>;
}

export interface SecurityEvent {
  _id: string;
  ip: string;
  path: string;
  payload: string;
  headers: Record<string, string>;
  xss: ThreatAnalysis;
  sqli: ThreatAnalysis;
  top_threat: 'xss' | 'sqli';
  confidence: number;
  action: 'monitor' | 'alert' | 'auto_block_temp';
  created_at: string;
  status: 'active' | 'undone';
  false_positive?: boolean;
  is_malicious?: boolean;
}

export interface BlockedIP {
  ip: string;
  blocked_at: string;
  reason: 'auto' | 'manual';
  related_events: number;
}

export interface DashboardStats {
  total_events_today: number;
  active_blocks: number;
  threats_detected: {
    xss: number;
    sqli: number;
    benign: number;
  };
  alert_rate: number;
}

export interface EventFilters {
  dateFrom?: string;
  dateTo?: string;
  threatType?: 'xss' | 'sqli' | 'benign' | '';
  action?: 'monitor' | 'alert' | 'auto_block_temp' | '';
  ip?: string;
}

export interface ApiConfig {
  baseUrl: string;
  useMockData: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  total_predictions: number;
}

export interface DetectionStats {
  total_events: number;
  malicious_detected: number;
  benign_detected: number;
  false_positives: number;
  false_negatives: number;
  true_positives: number;
  true_negatives: number;
}

export interface TimeSeriesData {
  date: string;
  xss: number;
  sqli: number;
  benign: number;
  total: number;
}

export interface ConfidenceBucket {
  bucket: string;
  count: number;
}

export interface TopIP {
  ip: string;
  count: number;
  malicious: number;
  benign: number;
}

export interface AnalyticsData {
  model_performance: {
    xss: ModelPerformance;
    sqli: ModelPerformance;
    overall: ModelPerformance;
  };
  detection_stats: DetectionStats;
  time_series: TimeSeriesData[];
  confidence_distribution: {
    xss: ConfidenceBucket[];
    sqli: ConfidenceBucket[];
    overall: ConfidenceBucket[];
  };
  action_distribution: {
    monitor: number;
    alert: number;
    auto_block_temp: number;
  };
  top_ips: TopIP[];
  threat_breakdown: {
    xss: number;
    sqli: number;
    benign: number;
  };
}
