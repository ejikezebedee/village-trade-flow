import { useEffect } from 'react';

interface PerformanceMonitorProps {
  name: string;
  children: React.ReactNode;
}

export function PerformanceMonitor({ name, children }: PerformanceMonitorProps) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 100) { // Log slow renders (> 100ms)
        console.warn(`Slow render detected in ${name}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [name]);

  return <>{children}</>;
}

export default PerformanceMonitor;