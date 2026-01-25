import { useState, useEffect } from 'react';
import { Search, Bell, RefreshCw, Moon, Sun, Wifi, WifiOff, Menu, Database, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppContext } from '@/context/AppContext';
import { useApiHealth } from '@/hooks/useSecurityData';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export const Header = ({ onMobileMenuToggle }: HeaderProps) => {
  const { config, toggleAutoRefresh, toggleMockData, theme, toggleTheme } = useAppContext();
  const { data: isApiHealthy } = useApiHealth();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (config.autoRefresh) {
      const interval = setInterval(() => {
        setLastRefresh(new Date());
      }, config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [config.autoRefresh, config.refreshInterval]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="global-search"
            placeholder="Search events... (⌘K)"
            className="w-64 pl-9 bg-secondary/50 border-border focus:ring-primary"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* API Status */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
          {isApiHealthy ? (
            <>
              <Wifi className="h-4 w-4 text-success" />
              <span className="text-xs text-success">API Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">API Offline</span>
            </>
          )}
        </div>

        {/* Mock/Live Data Toggle */}
        <div className={cn(
          "hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5",
          config.useMockData ? "bg-warning/10 border border-warning/30" : "bg-success/10 border border-success/30"
        )}>
          {config.useMockData ? (
            <>
              <Database className="h-4 w-4 text-warning" />
              <span className="text-xs text-warning font-medium">Mock</span>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4 text-success" />
              <span className="text-xs text-success font-medium">Live</span>
            </>
          )}
          <Switch
            checked={!config.useMockData}
            onCheckedChange={toggleMockData}
            className="scale-75"
          />
        </div>

        {/* Auto Refresh Toggle */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
          <RefreshCw className={cn(
            'h-4 w-4 transition-all',
            config.autoRefresh && 'text-primary animate-spin',
            !config.autoRefresh && 'text-muted-foreground'
          )} style={{ animationDuration: '3s' }} />
          <span className="text-xs text-muted-foreground">Auto</span>
          <Switch
            checked={config.autoRefresh}
            onCheckedChange={toggleAutoRefresh}
            className="scale-75"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span className="font-medium">Auto-blocked IP</span>
              </div>
              <span className="text-xs text-muted-foreground">45.33.32.156 blocked for XSS attempt</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span className="font-medium">High threat detected</span>
              </div>
              <span className="text-xs text-muted-foreground">SQLi attempt from 10.0.0.42</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="font-medium">System healthy</span>
              </div>
              <span className="text-xs text-muted-foreground">All detection models running</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
};
