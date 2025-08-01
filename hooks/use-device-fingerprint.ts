'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

interface DeviceAnalysis {
  isExistingDevice: boolean;
  firstSeen: string;
  lastSeen: string;
  associatedAccounts: number;
  riskScore: number;
  isProxy: boolean;
  location: any;
}

interface UseDeviceFingerprintReturn {
  deviceFingerprint: DeviceFingerprintData | null;
  deviceAnalysis: DeviceAnalysis | null;
  isLoading: boolean;
  error: string | null;
  generateFingerprint: () => Promise<DeviceFingerprintData>;
  checkDeviceHistory: () => Promise<DeviceAnalysis>;
  trackActivity: (action: string, details?: any) => Promise<void>;
}

export function useDeviceFingerprint(): UseDeviceFingerprintReturn {
  const { data: session } = useSession();
  const [deviceFingerprint, setDeviceFingerprint] = useState<DeviceFingerprintData | null>(null);
  const [deviceAnalysis, setDeviceAnalysis] = useState<DeviceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false); // Prevent multiple simultaneous calls
  const lastCallTimeRef = useRef<number>(0); // Track last API call time

  // Generate device fingerprint
  const generateFingerprint = useCallback(async (): Promise<DeviceFingerprintData> => {
    try {
      // Collect device data
      const canvasFingerprint = await generateCanvasFingerprint();
      const webglFingerprint = await generateWebGLFingerprint();
      const fontFingerprint = await generateFontFingerprint();
      const audioFingerprint = await generateAudioFingerprint();

      const dataString = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        !!window.sessionStorage,
        !!window.localStorage,
        !!window.indexedDB,
        canvasFingerprint,
        webglFingerprint,
        fontFingerprint,
        audioFingerprint,
      ].join('|');

      const deviceId = await simpleHash(dataString);

      const fingerprint: DeviceFingerprintData = {
        deviceId,
        browser: getBrowserInfo(),
        os: getOSInfo(),
        screenRes: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        userAgent: navigator.userAgent,
      };

      setDeviceFingerprint(fingerprint);
      return fingerprint;
    } catch (err) {
      console.error('Error generating device fingerprint:', err);
      throw err;
    }
  }, []);

  // Check device history in database
  const checkDeviceHistory = useCallback(async (): Promise<DeviceAnalysis> => {
    if (!deviceFingerprint) {
      throw new Error('Device fingerprint not generated');
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/device-fingerprint?deviceId=${deviceFingerprint.deviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check device history');
      }

      const analysis = await response.json();
      setDeviceAnalysis(analysis);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [deviceFingerprint]);

  // Track user activity
  const trackActivity = useCallback(async (action: string, details?: any) => {
    if (!deviceFingerprint) return;

    try {
      await fetch('/api/analytics/behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session?.user?.id,
          eventType: action,
          pageUrl: window.location.href,
          referrerUrl: document.referrer,
          userId: session?.user?.id,
          deviceId: deviceFingerprint.deviceId,
          timestamp: new Date().toISOString(),
          interactionData: details,
        }),
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [deviceFingerprint, session?.user?.id]);

  // Initialize device fingerprinting on mount (only once)
  useEffect(() => {
    console.log('[DEBUG] useDeviceFingerprint useEffect triggered, isInitialized:', isInitializedRef.current);
    
    if (isInitializedRef.current || isProcessingRef.current) {
      console.log('[DEBUG] Device fingerprint already initialized or processing, skipping');
      return; // Prevent multiple initializations
    }

    // Debounce to prevent rapid successive calls
    const now = Date.now();
    if (now - lastCallTimeRef.current < 1000) { // 1 second debounce
      console.log('[DEBUG] Debouncing device fingerprint initialization');
      return;
    }

    const initFingerprint = async () => {
      console.log('[DEBUG] Starting device fingerprint initialization');
      try {
        isProcessingRef.current = true;
        lastCallTimeRef.current = now;
        setIsLoading(true);
        setError(null);

        // Generate fingerprint
        const fingerprint = await generateFingerprint();
        console.log('[DEBUG] Device fingerprint generated:', fingerprint.deviceId);
        
        // Send to backend for storage and analysis
        await fetch('/api/device-fingerprint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId: fingerprint.deviceId,
            browser: fingerprint.browser,
            os: fingerprint.os,
            screenRes: fingerprint.screenRes,
            timezone: fingerprint.timezone,
            language: fingerprint.language,
            userAgent: fingerprint.userAgent,
            userId: session?.user?.id, // Link to user if logged in
          }),
        });

        isInitializedRef.current = true;
        console.log('[DEBUG] Device fingerprint initialization completed');

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error initializing device fingerprint:', err);
      } finally {
        setIsLoading(false);
        isProcessingRef.current = false;
      }
    };

    initFingerprint();
  }, [session?.user?.id, generateFingerprint]); // Added generateFingerprint to dependencies

  // Check device history after fingerprint is generated (debounced)
  useEffect(() => {
    if (deviceFingerprint && !deviceAnalysis && !isLoading && !isProcessingRef.current) {
      const now = Date.now();
      if (now - lastCallTimeRef.current < 2000) { // 2 second debounce for history check
        return;
      }

      const checkHistory = async () => {
        try {
          isProcessingRef.current = true;
          lastCallTimeRef.current = now;
          console.log('[DEBUG] Checking device history for:', deviceFingerprint.deviceId);
          const analysis = await checkDeviceHistory();
          console.log('[DEBUG] Device history checked:', analysis);
        } catch (err) {
          console.error('Error checking device history:', err);
        } finally {
          isProcessingRef.current = false;
        }
      };
      
      checkHistory();
    }
  }, [deviceFingerprint, deviceAnalysis, isLoading, checkDeviceHistory]);

  return {
    deviceFingerprint,
    deviceAnalysis,
    isLoading,
    error,
    generateFingerprint,
    checkDeviceHistory,
    trackActivity,
  };
}

// Enhanced activity tracking hook
export function useActivityTracking() {
  const { trackActivity } = useDeviceFingerprint();

  const trackLogin = useCallback(async (success: boolean, details?: any) => {
    await trackActivity(success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED', details);
  }, [trackActivity]);

  const trackSignup = useCallback(async (details?: any) => {
    await trackActivity('SIGNUP', details);
  }, [trackActivity]);

  const trackCheckout = useCallback(async (details?: any) => {
    await trackActivity('CHECKOUT', details);
  }, [trackActivity]);

  const trackProductView = useCallback(async (productId: string, details?: any) => {
    await trackActivity('PRODUCT_VIEW', { productId, ...details });
  }, [trackActivity]);

  const trackSearch = useCallback(async (query: string, details?: any) => {
    await trackActivity('SEARCH', { query, ...details });
  }, [trackActivity]);

  const trackPasswordChange = useCallback(async (details?: any) => {
    await trackActivity('PASSWORD_CHANGE', details);
  }, [trackActivity]);

  const trackPaymentMethod = useCallback(async (details?: any) => {
    await trackActivity('PAYMENT_METHOD_ADDED', details);
  }, [trackActivity]);

  return {
    trackLogin,
    trackSignup,
    trackCheckout,
    trackProductView,
    trackSearch,
    trackPasswordChange,
    trackPaymentMethod,
  };
}

// Utility functions for fingerprinting
async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw some text and shapes
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprinting test', 2, 2);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillRect(100, 5, 80, 20);

    return canvas.toDataURL();
  } catch {
    return '';
  }
}

async function generateWebGLFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (!gl) return '';

    return gl.getParameter(gl.VENDOR) + '~' + gl.getParameter(gl.RENDERER);
  } catch {
    return '';
  }
}

async function generateFontFingerprint(): Promise<string> {
  try {
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const h = document.getElementsByTagName('body')[0];
    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    h.appendChild(s);
    const defaultWidth = s.offsetWidth;
    const defaultHeight = s.offsetHeight;

    const fonts = ['Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New'];
    const results: string[] = [];

    for (const font of fonts) {
      s.style.fontFamily = font;
      const width = s.offsetWidth;
      const height = s.offsetHeight;
      results.push(`${font}:${width}x${height}`);
    }

    h.removeChild(s);
    return results.join(',');
  } catch {
    return '';
  }
}

async function generateAudioFingerprint(): Promise<string> {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0; // No sound
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(0);

    return audioContext.sampleRate.toString();
  } catch {
    return '';
  }
}

function getBrowserInfo(): string {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';

  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  return browser;
}

function getOSInfo(): string {
  const userAgent = navigator.userAgent;
  let os = 'Unknown';

  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return os;
} 