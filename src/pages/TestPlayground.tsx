import { useState } from 'react';
import { Send, Shield, ShieldAlert, ShieldX, Loader2, Trash2, Copy, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { analyzePayload } from '@/services/api';
import { cn } from '@/lib/utils';

interface DetectionResult {
  id: string;
  payload: string;
  timestamp: Date;
  is_malicious: boolean;
  action: string;
  attack_type: string;
  confidence: number;
  xss: { label: string; confidence: number };
  sqli: { label: string; confidence: number };
}

const samplePayloads = {
  xss: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(document.cookie)>',
    '<svg onload=alert(1)>',
    '"><img src=x onerror=prompt(1)>',
    'javascript:alert(document.domain)',
  ],
  sqli: [
    "' OR '1'='1",
    "1; DROP TABLE users--",
    "admin'--",
    "' UNION SELECT * FROM passwords--",
    "1' AND '1'='1",
  ],
  benign: [
    'Hello, world!',
    'This is a normal comment',
    'john.doe@example.com',
    'The quick brown fox jumps over the lazy dog',
  ],
};

const TestPlayground = () => {
  const [payload, setPayload] = useState('');
  const [sourceIp, setSourceIp] = useState('test-client');
  const [targetUrl, setTargetUrl] = useState('/test');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!payload.trim()) {
      toast({
        title: 'Empty Payload',
        description: 'Please enter a payload to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await analyzePayload(payload, sourceIp, targetUrl);
      
      const result: DetectionResult = {
        id: response.request_id,
        payload: payload,
        timestamp: new Date(),
        is_malicious: response.is_malicious,
        action: response.action,
        attack_type: response.details.attack_type,
        confidence: response.details.confidence,
        xss: response.details.xss,
        sqli: response.details.sqli,
      };

      setResults(prev => [result, ...prev]);
      
      toast({
        title: response.is_malicious ? '🚨 Threat Detected!' : '✅ Safe Payload',
        description: response.is_malicious 
          ? `${response.details.attack_type.toUpperCase()} attack detected with ${(response.details.confidence * 100).toFixed(1)}% confidence`
          : 'No threats detected in this payload',
        variant: response.is_malicious ? 'destructive' : 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to analyze payload. Make sure the backend is running.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleClick = (sample: string) => {
    setPayload(sample);
  };

  const clearResults = () => {
    setResults([]);
  };

  const copyPayload = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Payload copied to clipboard' });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-destructive';
    if (confidence >= 0.7) return 'text-warning';
    if (confidence >= 0.5) return 'text-primary';
    return 'text-success';
  };

  const getActionBadge = (action: string, is_malicious: boolean) => {
    if (!is_malicious) return <Badge variant="outline" className="border-success text-success">Safe</Badge>;
    switch (action) {
      case 'auto_block_temp':
        return <Badge variant="destructive">Blocked</Badge>;
      case 'alert':
        return <Badge className="bg-warning text-warning-foreground">Alert</Badge>;
      default:
        return <Badge variant="secondary">Monitor</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Test Playground</h1>
        <p className="text-muted-foreground">
          Test the XSS and SQLi detection system with custom payloads
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Payload Analyzer
              </CardTitle>
              <CardDescription>
                Enter a payload to test against our ML detection models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payload</label>
                <Textarea
                  placeholder="Enter your payload here... e.g., <script>alert('XSS')</script>"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  className="min-h-[120px] font-mono text-sm bg-secondary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source IP</label>
                  <Input
                    placeholder="192.168.1.100"
                    value={sourceIp}
                    onChange={(e) => setSourceIp(e.target.value)}
                    className="bg-secondary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target URL</label>
                  <Input
                    placeholder="/api/endpoint"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="bg-secondary/30"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Analyze Payload
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Sample Payloads */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Sample Payloads</CardTitle>
              <CardDescription>Click to use these test payloads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                  <ShieldX className="h-4 w-4" />
                  XSS Payloads
                </h4>
                <div className="flex flex-wrap gap-2">
                  {samplePayloads.xss.map((sample, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs font-mono h-auto py-1 px-2 border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleSampleClick(sample)}
                    >
                      {sample.length > 25 ? sample.substring(0, 25) + '...' : sample}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-warning mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  SQLi Payloads
                </h4>
                <div className="flex flex-wrap gap-2">
                  {samplePayloads.sqli.map((sample, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs font-mono h-auto py-1 px-2 border-warning/30 hover:bg-warning/10"
                      onClick={() => handleSampleClick(sample)}
                    >
                      {sample.length > 25 ? sample.substring(0, 25) + '...' : sample}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-success mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Benign Payloads
                </h4>
                <div className="flex flex-wrap gap-2">
                  {samplePayloads.benign.map((sample, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs font-mono h-auto py-1 px-2 border-success/30 hover:bg-success/10"
                      onClick={() => handleSampleClick(sample)}
                    >
                      {sample.length > 25 ? sample.substring(0, 25) + '...' : sample}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Detection Results</h2>
            {results.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearResults} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {results.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No results yet</p>
                <p className="text-sm text-muted-foreground">Enter a payload and click Analyze</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
              {results.map((result, index) => (
                <Card 
                  key={result.id + index} 
                  className={cn(
                    "glass-card transition-all animate-fade-in",
                    result.is_malicious ? "border-destructive/30" : "border-success/30"
                  )}
                >
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {result.is_malicious ? (
                          <ShieldAlert className="h-5 w-5 text-destructive" />
                        ) : (
                          <Shield className="h-5 w-5 text-success" />
                        )}
                        <div>
                          <p className="font-medium">
                            {result.is_malicious ? 'Threat Detected' : 'Safe'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.is_malicious && (
                          <Badge variant="outline" className={cn(
                            result.attack_type === 'xss' ? 'border-destructive text-destructive' : 'border-warning text-warning'
                          )}>
                            {result.attack_type.toUpperCase()}
                          </Badge>
                        )}
                        {getActionBadge(result.action, result.is_malicious)}
                      </div>
                    </div>

                    <div className="relative">
                      <pre className="rounded-lg bg-background p-3 text-xs font-mono overflow-x-auto">
                        {result.payload}
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => copyPayload(result.payload)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">XSS</span>
                          <span className={getConfidenceColor(result.xss.confidence)}>
                            {(result.xss.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={result.xss.confidence * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {result.xss.label === 'malicious' ? '⚠️ Malicious' : '✓ Benign'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">SQLi</span>
                          <span className={getConfidenceColor(result.sqli.confidence)}>
                            {(result.sqli.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={result.sqli.confidence * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {result.sqli.label === 'malicious' ? '⚠️ Malicious' : '✓ Benign'}
                        </p>
                      </div>
                    </div>

                    {result.is_malicious && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Overall Confidence</span>
                          <span className={cn("text-lg font-bold", getConfidenceColor(result.confidence))}>
                            {(result.confidence * 100).toFixed(2)}%
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPlayground;
