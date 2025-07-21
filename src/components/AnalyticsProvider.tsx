import React, { createContext, useContext, useEffect } from 'react';
import { usePageTracking, setupAnalytics } from '@/hooks/useAnalytics';

// Optional Google Analytics tracking ID - replace with your actual ID if needed
const GA_TRACKING_ID = '';

interface AnalyticsContextType {
  // Add any analytics context methods here if needed
}

const AnalyticsContext = createContext<AnalyticsContextType>({});

export const useAnalyticsContext = () => useContext(AnalyticsContext);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  // Set up analytics tracking
  usePageTracking();

  useEffect(() => {
    // Initialize analytics services
    if (GA_TRACKING_ID) {
      setupAnalytics(GA_TRACKING_ID);
    }

    // Track initial session
    const sessionStart = Date.now();
    sessionStorage.setItem('session_start', sessionStart.toString());

    // Handle page unload to track session end
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStart;
      // Track session end event
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          event: 'session_end',
          duration: sessionDuration,
          timestamp: Date.now()
        });
        navigator.sendBeacon('/api/analytics', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const contextValue: AnalyticsContextType = {
    // Add context methods here if needed
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};