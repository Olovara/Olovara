'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDeviceFingerprint } from '@/hooks/use-device-fingerprint';
import { useAnalyticsTracking } from '@/hooks/use-analytics-tracking';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { data: session } = useSession();
  
  // Initialize device fingerprinting
  const { 
    deviceFingerprint, 
    deviceAnalysis, 
    isLoading: deviceLoading,
    error: deviceError,
    generateFingerprint,
    checkDeviceHistory,
    trackActivity 
  } = useDeviceFingerprint();

  // Initialize analytics tracking
  const { 
    sessionId,
    trackPageView,
    trackInteraction,
    trackSearch,
    trackProductInteraction,
  } = useAnalyticsTracking({
    sessionId: undefined, // Will be auto-generated
    pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    referrerUrl: typeof document !== 'undefined' ? document.referrer : undefined
  });

  // Initialize device fingerprinting on mount
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        // Generate device fingerprint if not already done
        if (!deviceFingerprint) {
          await generateFingerprint();
        }

        // Check device history for fraud detection
        if (deviceFingerprint?.deviceId) {
          await checkDeviceHistory();
        }

        // Track initial page view
        if (sessionId) {
          await trackPageView(window.location.href, document.referrer);
        }

        // Track device fingerprinting activity
        if (session?.user?.id && deviceFingerprint?.deviceId) {
          await trackActivity('DEVICE_FINGERPRINT_GENERATED', {
            deviceId: deviceFingerprint.deviceId,
            isExistingDevice: deviceAnalysis?.isExistingDevice || false,
            riskScore: deviceAnalysis?.riskScore || 0
          });
        }
      } catch (error) {
        console.error('Analytics initialization error:', error);
      }
    };

    initAnalytics();
  }, [
    session?.user?.id, 
    deviceFingerprint, 
    sessionId, 
    generateFingerprint, 
    checkDeviceHistory, 
    trackPageView, 
    trackActivity, 
    deviceAnalysis?.isExistingDevice, 
    deviceAnalysis?.riskScore
  ]);

  // Track page visibility changes for session management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - could end session or pause tracking
        console.log('Page hidden - pausing analytics tracking');
      } else {
        // Page is visible again - resume tracking
        console.log('Page visible - resuming analytics tracking');
        if (sessionId) {
          trackPageView(window.location.href, document.referrer);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, trackPageView]);

  // Track beforeunload to end session properly
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId) {
        // Use sendBeacon for reliable data sending before page unload
        const data = {
          sessionId,
          action: 'SESSION_END',
          timestamp: new Date().toISOString()
        };
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/session', JSON.stringify(data));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId]);

  // Log analytics status for debugging
  useEffect(() => {
    if (deviceError) {
      console.warn('Device fingerprinting error:', deviceError);
    }
    
    if (deviceAnalysis && deviceAnalysis.isExistingDevice) {
      console.log('Existing device detected:', {
        deviceId: deviceFingerprint?.deviceId,
        riskScore: deviceAnalysis.riskScore,
        associatedAccounts: deviceAnalysis.associatedAccounts
      });
    }
  }, [deviceError, deviceAnalysis, deviceFingerprint]);

  return <>{children}</>;
} 