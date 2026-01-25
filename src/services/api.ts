import { SecurityEvent, BlockedIP, DashboardStats, EventFilters, AnalyticsData } from '@/types/security';

const API_BASE = 'http://localhost:8003';

// Mock data for development fallback
const generateMockEvents = (count: number): SecurityEvent[] => {
  const paths = ['/login', '/api/users', '/search', '/admin', '/api/data', '/submit', '/query'];
  const ips = ['192.168.1.105', '10.0.0.42', '172.16.0.88', '45.33.32.156', '203.0.113.42', '198.51.100.23'];
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '"><img src=x onerror=alert(1)>',
    'javascript:alert(document.cookie)',
    '<svg onload=alert(1)>',
  ];
  const sqliPayloads = [
    "' OR '1'='1",
    "1; DROP TABLE users--",
    "admin'--",
    "' UNION SELECT * FROM passwords--",
  ];

  return Array.from({ length: count }, (_, i) => {
    const isXss = Math.random() > 0.5;
    const isMalicious = Math.random() > 0.3;
    const confidence = isMalicious ? 0.7 + Math.random() * 0.3 : Math.random() * 0.3;
    
    let action: 'monitor' | 'alert' | 'auto_block_temp' = 'monitor';
    if (confidence > 0.9995) action = 'auto_block_temp';
    else if (confidence > 0.8) action = 'alert';

    const xssLabel: 'malicious' | 'benign' = isXss && isMalicious ? 'malicious' : 'benign';
    const sqliLabel: 'malicious' | 'benign' = !isXss && isMalicious ? 'malicious' : 'benign';
    const eventStatus: 'active' | 'undone' = 'active';
    const topThreat: 'xss' | 'sqli' = isXss ? 'xss' : 'sqli';

    return {
      _id: `evt_${Date.now()}_${i}`,
      ip: ips[Math.floor(Math.random() * ips.length)],
      path: paths[Math.floor(Math.random() * paths.length)],
      payload: isXss 
        ? xssPayloads[Math.floor(Math.random() * xssPayloads.length)]
        : sqliPayloads[Math.floor(Math.random() * sqliPayloads.length)],
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      xss: {
        label: xssLabel,
        confidence: isXss ? confidence : Math.random() * 0.2,
        explanation: { pattern_match: isXss ? 'script_tag' : null },
      },
      sqli: {
        label: sqliLabel,
        confidence: !isXss ? confidence : Math.random() * 0.2,
        explanation: { pattern_match: !isXss ? 'sql_injection' : null },
      },
      top_threat: topThreat,
      confidence,
      action,
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      status: eventStatus,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

const mockEvents = generateMockEvents(100);
const mockBlockedIPs: BlockedIP[] = [
  { ip: '45.33.32.156', blocked_at: new Date(Date.now() - 3600000).toISOString(), reason: 'auto', related_events: 5 },
  { ip: '203.0.113.42', blocked_at: new Date(Date.now() - 7200000).toISOString(), reason: 'manual', related_events: 3 },
];

// Check if API is available
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};

// Fetch events
export const fetchEvents = async (
  filters?: EventFilters,
  limit: number = 50,
  useMock: boolean = false
): Promise<SecurityEvent[]> => {
  if (useMock) {
    let events = [...mockEvents];
    
    if (filters?.threatType) {
      events = events.filter(e => {
        if (filters.threatType === 'benign') {
          return e.xss.label === 'benign' && e.sqli.label === 'benign';
        }
        return e.top_threat === filters.threatType && e.confidence > 0.5;
      });
    }
    
    if (filters?.action) {
      events = events.filter(e => e.action === filters.action);
    }
    
    if (filters?.ip) {
      events = events.filter(e => e.ip.includes(filters.ip!));
    }
    
    return events.slice(0, limit);
  }

  try {
    // Build query params
    const params = new URLSearchParams({ limit: limit.toString() });
    if (filters?.threatType && filters.threatType !== '') {
      params.append('threatType', filters.threatType);
    }
    if (filters?.action && filters.action !== '') {
      params.append('action', filters.action);
    }
    if (filters?.ip) {
      params.append('ip', filters.ip);
    }

    const response = await fetch(`${API_BASE}/events?${params}`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock on error
    return fetchEvents(filters, limit, true);
  }
};

// Get dashboard stats
export const fetchDashboardStats = async (useMock: boolean = false): Promise<DashboardStats> => {
  if (useMock) {
    const todayEvents = mockEvents.filter(e => {
      const eventDate = new Date(e.created_at);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    });

    const xssCount = todayEvents.filter(e => e.top_threat === 'xss' && e.confidence > 0.5).length;
    const sqliCount = todayEvents.filter(e => e.top_threat === 'sqli' && e.confidence > 0.5).length;
    const benignCount = todayEvents.length - xssCount - sqliCount;
    const alertCount = todayEvents.filter(e => e.action !== 'monitor').length;

    return {
      total_events_today: todayEvents.length,
      active_blocks: mockBlockedIPs.length,
      threats_detected: { xss: xssCount, sqli: sqliCount, benign: benignCount },
      alert_rate: todayEvents.length > 0 ? (alertCount / todayEvents.length) * 100 : 0,
    };
  }

  try {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    return fetchDashboardStats(true);
  }
};

// Fetch blocked IPs
export const fetchBlockedIPs = async (useMock: boolean = false): Promise<BlockedIP[]> => {
  if (useMock) {
    return mockBlockedIPs;
  }

  try {
    const response = await fetch(`${API_BASE}/blocklist`);
    if (!response.ok) throw new Error('Failed to fetch blocklist');
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    return mockBlockedIPs;
  }
};

// Block an IP
export const blockIP = async (ip: string, useMock: boolean = false): Promise<void> => {
  if (useMock) {
    const exists = mockBlockedIPs.find(b => b.ip === ip);
    if (!exists) {
      mockBlockedIPs.push({
        ip,
        blocked_at: new Date().toISOString(),
        reason: 'manual',
        related_events: mockEvents.filter(e => e.ip === ip).length,
      });
    }
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/block/${ip}`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to block IP (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // Use default error message
        }
      }
      console.error('Block IP failed:', response.status, errorMessage);
      throw new Error(errorMessage);
    }
    
    // Check response body for success confirmation
    try {
      const result = await response.json();
      if (result.success === false) {
        throw new Error(result.message || 'Failed to block IP');
      }
    } catch {
      // If response is not JSON, that's okay - status code was 200
    }
  } catch (error) {
    console.error('Block IP error:', error);
    throw error;
  }
};

// Unblock an IP
export const unblockIP = async (ip: string, useMock: boolean = false): Promise<void> => {
  if (useMock) {
    const index = mockBlockedIPs.findIndex(b => b.ip === ip);
    if (index > -1) mockBlockedIPs.splice(index, 1);
    return;
  }

  const response = await fetch(`${API_BASE}/unblock/${ip}`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to unblock IP');
};

// Undo event action
export const undoEventAction = async (eventId: string, useMock: boolean = false): Promise<void> => {
  if (useMock) {
    const event = mockEvents.find(e => e._id === eventId);
    if (event) event.status = 'undone';
    return;
  }

  const response = await fetch(`${API_BASE}/events/${eventId}/undo`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to undo action');
};

// Mark event as false positive
export const markFalsePositive = async (eventId: string, useMock: boolean = false): Promise<void> => {
  if (useMock) {
    const event = mockEvents.find(e => e._id === eventId);
    if (event) {
      (event as any).false_positive = true;
      // If it was auto-blocked, unblock the IP
      if (event.action === 'auto_block_temp') {
        const index = mockBlockedIPs.findIndex(b => b.ip === event.ip);
        if (index > -1) mockBlockedIPs.splice(index, 1);
      }
    }
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/false-positive`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to mark as false positive (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // Use default error message
        }
      }
      console.error('Mark false positive failed:', response.status, errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Mark false positive error:', error);
    throw error;
  }
};

// Analyze a payload (new function for testing)
export const analyzePayload = async (
  payload: string,
  sourceIp: string = 'test-client',
  url: string = '/test'
): Promise<{
  request_id: string;
  is_malicious: boolean;
  action: string;
  details: {
    attack_type: string;
    confidence: number;
    xss: { label: string; confidence: number };
    sqli: { label: string; confidence: number };
  };
}> => {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload,
      source_ip: sourceIp,
      url,
      headers: { 'User-Agent': navigator.userAgent }
    })
  });
  
  if (!response.ok) throw new Error('Failed to analyze payload');
  return response.json();
};

// Generate chart data
export const getEventTimeSeriesData = (events: SecurityEvent[]) => {
  const hourlyData: Record<string, { hour: string; xss: number; sqli: number; benign: number }> = {};
  
  events.forEach(event => {
    const hour = new Date(event.created_at).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false });
    
    if (!hourlyData[hour]) {
      hourlyData[hour] = { hour, xss: 0, sqli: 0, benign: 0 };
    }
    
    // Check if event is benign: both XSS and SQLi are benign, or is_malicious is explicitly false
    const isBenign = event.is_malicious === false || 
                     (event.xss.label === 'benign' && event.sqli.label === 'benign');
    
    if (isBenign) {
      hourlyData[hour].benign++;
    } else if (event.top_threat === 'xss') {
      hourlyData[hour].xss++;
    } else {
      hourlyData[hour].sqli++;
    }
  });

  return Object.values(hourlyData).sort((a, b) => a.hour.localeCompare(b.hour));
};

// Fetch analytics data - ALWAYS uses real data from backend
export const fetchAnalytics = async (useMock: boolean = false): Promise<AnalyticsData> => {
  // Never use mock data for analytics - always fetch real data
  try {
    const response = await fetch(`${API_BASE}/analytics`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analytics API Error:', response.status, errorText);
      throw new Error(`Failed to fetch analytics: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    console.log('Analytics data fetched:', data);
    return data;
  } catch (error) {
    console.error('Analytics fetch error:', error);
    // Return empty/zero data structure instead of mock data
    return {
      model_performance: {
        xss: { accuracy: 0, precision: 0, recall: 0, f1_score: 0, total_predictions: 0 },
        sqli: { accuracy: 0, precision: 0, recall: 0, f1_score: 0, total_predictions: 0 },
        overall: { accuracy: 0, precision: 0, recall: 0, f1_score: 0, total_predictions: 0 }
      },
      detection_stats: {
        total_events: 0,
        malicious_detected: 0,
        benign_detected: 0,
        false_positives: 0,
        false_negatives: 0,
        true_positives: 0,
        true_negatives: 0
      },
      time_series: [],
      confidence_distribution: {
        xss: [
          { bucket: "0-0.2", count: 0 },
          { bucket: "0.2-0.4", count: 0 },
          { bucket: "0.4-0.6", count: 0 },
          { bucket: "0.6-0.8", count: 0 },
          { bucket: "0.8-1.0", count: 0 }
        ],
        sqli: [
          { bucket: "0-0.2", count: 0 },
          { bucket: "0.2-0.4", count: 0 },
          { bucket: "0.4-0.6", count: 0 },
          { bucket: "0.6-0.8", count: 0 },
          { bucket: "0.8-1.0", count: 0 }
        ],
        overall: [
          { bucket: "0-0.2", count: 0 },
          { bucket: "0.2-0.4", count: 0 },
          { bucket: "0.4-0.6", count: 0 },
          { bucket: "0.6-0.8", count: 0 },
          { bucket: "0.8-1.0", count: 0 }
        ]
      },
      action_distribution: { monitor: 0, alert: 0, auto_block_temp: 0 },
      top_ips: [],
      threat_breakdown: { xss: 0, sqli: 0, benign: 0 }
    };
  }
};
