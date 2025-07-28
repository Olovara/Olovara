'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface DeviceFingerprintData {
  deviceId: string;
  browser: string;
  os: string;
  screenRes: string;
  timezone: string;
  language: string;
  userAgent: string;
}

interface UseDeviceFingerprintReturn {
  deviceFingerprint: DeviceFingerprintData | null;
  isLoading: boolean;
  error: string | null;
  trackActivity: (action: string, details?: any) => Promise<void>;
}

export function useDeviceFingerprint(): UseDeviceFingerprintReturn {
  const { data: session } = useSession();
  const [deviceFingerprint, setDeviceFingerprint] = useState<DeviceFingerprintData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate device fingerprint using browser APIs
  const generateFingerprint = useCallback(async (): Promise<DeviceFingerprintData> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    const fingerprint = {
      deviceId: '', // Will be generated from entropy data
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
               navigator.userAgent.includes('Firefox') ? 'Firefox' :
               navigator.userAgent.includes('Safari') ? 'Safari' :
               navigator.userAgent.includes('Edge') ? 'Edge' : 'Unknown',
      os: navigator.platform,
      screenRes: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      userAgent: navigator.userAgent
    };

    // Generate device ID from entropy data
    const entropyData = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      (navigator as any).deviceMemory || 0,
      navigator.platform,
      navigator.cookieEnabled,
      navigator.doNotTrack,
      navigator.onLine,
      screen.colorDepth,
      screen.pixelDepth,
      navigator.maxTouchPoints,
      'ontouchstart' in window,
      'ontouchmove' in window,
      'ontouchend' in window
    ].join('|');

    // Simple hash function (in production, use a proper crypto library)
    let hash = 0;
    for (let i = 0; i < entropyData.length; i++) {
      const char = entropyData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    fingerprint.deviceId = Math.abs(hash).toString(36);

    return fingerprint;
  }, []);

  // Initialize device fingerprint
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fingerprint = await generateFingerprint();
        setDeviceFingerprint(fingerprint);

        // If user is logged in, send fingerprint to server
        if (session?.user?.id) {
          await fetch('/api/device-fingerprint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fingerprint)
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate device fingerprint');
      } finally {
        setIsLoading(false);
      }
    };

    initFingerprint();
  }, [session?.user?.id, generateFingerprint]);

  // Track user activity with device fingerprint
  const trackActivity = useCallback(async (action: string, details?: any) => {
    if (!session?.user?.id || !deviceFingerprint) {
      return;
    }

    try {
      await fetch('/api/user-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          deviceFingerprint: deviceFingerprint.deviceId,
          details
        })
      });
    } catch (err) {
      console.error('Failed to track activity:', err);
    }
  }, [session?.user?.id, deviceFingerprint]);

  return {
    deviceFingerprint,
    isLoading,
    error,
    trackActivity
  };
}

// Hook for tracking specific user actions
export function useActivityTracking() {
  const { trackActivity } = useDeviceFingerprint();

  const trackLogin = useCallback(async (success: boolean, details?: any) => {
    await trackActivity(success ? 'LOGIN' : 'FAILED_LOGIN', {
      ...details,
      timestamp: new Date().toISOString()
    });
  }, [trackActivity]);

  const trackSignup = useCallback(async (details?: any) => {
    await trackActivity('SIGNUP', {
      ...details,
      timestamp: new Date().toISOString()
    });
  }, [trackActivity]);

  const trackCheckout = useCallback(async (orderId: string, details?: any) => {
    await trackActivity('CHECKOUT', {
      orderId,
      ...details,
      timestamp: new Date().toISOString()
    });
  }, [trackActivity]);

  const trackProductView = useCallback(async (productId: string, details?: any) => {
    await trackActivity('PRODUCT_VIEW', {
      productId,
      ...details,
      timestamp: new Date().toISOString()
    });
  }, [trackActivity]);

  const trackSearch = useCallback(async (query: string, resultsCount: number, details?: any) => {
    await trackActivity('SEARCH', {
      query,
      resultsCount,
      ...details,
      timestamp: new Date().toISOString()
    });
  }, [trackActivity]);

  return {
    trackLogin,
    trackSignup,
    trackCheckout,
    trackProductView,
    trackSearch,
    trackActivity
  };
} 