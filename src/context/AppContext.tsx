import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiConfig } from '@/types/security';

interface AppContextType {
  config: ApiConfig;
  setConfig: React.Dispatch<React.SetStateAction<ApiConfig>>;
  toggleAutoRefresh: () => void;
  toggleMockData: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const defaultConfig: ApiConfig = {
  baseUrl: 'http://localhost:8003',
  useMockData: false,  // Use real API by default
  autoRefresh: true,
  refreshInterval: 5000,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('soc-config');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('soc-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('soc-config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('soc-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleAutoRefresh = () => {
    setConfig(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }));
  };

  const toggleMockData = () => {
    setConfig(prev => ({ ...prev, useMockData: !prev.useMockData }));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppContext.Provider value={{ config, setConfig, toggleAutoRefresh, toggleMockData, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
