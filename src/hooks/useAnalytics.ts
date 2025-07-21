import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get user agent details
const getUserAgentInfo = () => {
  const ua = navigator.userAgent;
  return {
    userAgent: ua,
    deviceType: /Mobile|Android|iPhone|iPad/.test(ua) ? 'mobile' : 'desktop',
    browser: ua.includes('Chrome') ? 'Chrome' : 
             ua.includes('Firefox') ? 'Firefox' : 
             ua.includes('Safari') ? 'Safari' : 'Other',
    os: ua.includes('Windows') ? 'Windows' :
        ua.includes('Mac') ? 'macOS' :
        ua.includes('Linux') ? 'Linux' : 'Other'
  };
};

// Initialize Google Analytics
const initializeGA = (trackingId: string) => {
  if (typeof window !== 'undefined' && !window.gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', trackingId);
  }
};

export const useAnalytics = () => {
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const pageStartTime = useRef(Date.now());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // Track page views
  const trackPageView = async (pageTitle?: string) => {
    try {
      const userAgentInfo = getUserAgentInfo();
      
      await supabase.rpc('track_page_view', {
        p_user_id: user?.id || null,
        p_session_id: sessionId.current,
        p_page_url: location.pathname + location.search,
        p_page_title: pageTitle || document.title,
        p_referrer: document.referrer || null,
        p_user_agent: userAgentInfo.userAgent
      });

      // Track with Google Analytics if available
      if (window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          page_title: pageTitle || document.title,
          page_location: window.location.href,
          page_path: location.pathname
        });
      }
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  // Track custom events
  const trackEvent = async (eventType: string, eventName: string, properties?: any) => {
    try {
      const userAgentInfo = getUserAgentInfo();
      
      await supabase.rpc('track_user_event', {
        p_user_id: user?.id || null,
        p_session_id: sessionId.current,
        p_event_type: eventType,
        p_event_name: eventName,
        p_page_url: location.pathname + location.search,
        p_event_properties: properties || {},
        p_user_agent: userAgentInfo.userAgent
      });

      // Track with Google Analytics if available
      if (window.gtag) {
        window.gtag('event', eventName, {
          event_category: eventType,
          event_label: properties?.label,
          value: properties?.value,
          custom_parameters: properties
        });
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  // Track product events
  const trackProductEvent = async (
    productId: string,
    eventType: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'favorite',
    productData?: any
  ) => {
    try {
      await supabase.rpc('track_product_event', {
        p_product_id: productId,
        p_user_id: user?.id || null,
        p_session_id: sessionId.current,
        p_event_type: eventType,
        p_category: productData?.category,
        p_price: productData?.price,
        p_event_properties: productData || {}
      });

      // Track with Google Analytics Enhanced Ecommerce
      if (window.gtag && productData) {
        const gaEvent = eventType === 'view' ? 'view_item' :
                       eventType === 'add_to_cart' ? 'add_to_cart' :
                       eventType === 'purchase' ? 'purchase' : 'select_item';
        
        window.gtag('event', gaEvent, {
          currency: 'USD',
          value: productData.price,
          items: [{
            item_id: productId,
            item_name: productData.name,
            item_category: productData.category,
            price: productData.price,
            quantity: 1
          }]
        });
      }
    } catch (error) {
      console.error('Error tracking product event:', error);
    }
  };

  // Track conversion events
  const trackConversion = async (
    funnelStage: 'awareness' | 'interest' | 'consideration' | 'purchase' | 'retention',
    eventType: string,
    value?: number,
    orderId?: string,
    productId?: string
  ) => {
    try {
      await supabase
        .from('conversion_events')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId.current,
          funnel_stage: funnelStage,
          event_type: eventType,
          product_id: productId || null,
          order_id: orderId || null,
          value: value || 0
        });

      // Track conversion with Google Analytics
      if (window.gtag && funnelStage === 'purchase') {
        window.gtag('event', 'purchase', {
          transaction_id: orderId,
          value: value,
          currency: 'USD'
        });
      }
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  };

  // Start session tracking
  const startSession = async () => {
    try {
      const userAgentInfo = getUserAgentInfo();
      const urlParams = new URLSearchParams(location.search);
      
      await supabase
        .from('user_sessions')
        .upsert({
          session_id: sessionId.current,
          user_id: user?.id || null,
          entry_page: location.pathname + location.search,
          referrer: document.referrer || null,
          user_agent: userAgentInfo.userAgent,
          device_type: userAgentInfo.deviceType,
          browser: userAgentInfo.browser,
          os: userAgentInfo.os,
          utm_source: urlParams.get('utm_source'),
          utm_medium: urlParams.get('utm_medium'),
          utm_campaign: urlParams.get('utm_campaign')
        });
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // End session tracking
  const endSession = async () => {
    try {
      const sessionDuration = Math.floor((Date.now() - pageStartTime.current) / 1000);
      
      await supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration: sessionDuration,
          exit_page: location.pathname + location.search
        })
        .eq('session_id', sessionId.current);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  return {
    trackPageView,
    trackEvent,
    trackProductEvent,
    trackConversion,
    startSession,
    endSession,
    sessionId: sessionId.current
  };
};

// Hook for automatic page view tracking
export const usePageTracking = () => {
  const { trackPageView, startSession } = useAnalytics();
  const location = useLocation();
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!hasTrackedRef.current) {
      startSession();
      hasTrackedRef.current = true;
    }
    trackPageView();
  }, [location.pathname, trackPageView, startSession]);
};

// Global analytics setup
export const setupAnalytics = (googleAnalyticsId?: string) => {
  if (googleAnalyticsId) {
    initializeGA(googleAnalyticsId);
  }
};

// Types for global gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}