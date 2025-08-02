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

  // Check if fingerprint exists in sessionStorage (persists for session)
  const getStoredFingerprint = useCallback((): DeviceFingerprintData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = sessionStorage.getItem('deviceFingerprint');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if it's from the same session (same user agent)
        if (parsed.userAgent === navigator.userAgent) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error reading stored fingerprint:', error);
    }
    return null;
  }, []);

  // Store fingerprint in sessionStorage
  const storeFingerprint = useCallback((fingerprint: DeviceFingerprintData) => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem('deviceFingerprint', JSON.stringify(fingerprint));
    } catch (error) {
      console.error('Error storing fingerprint:', error);
    }
  }, []);

  // Generate device fingerprint (only once per session)
  const generateFingerprint = useCallback(async (): Promise<DeviceFingerprintData> => {
    // Check if we already have a fingerprint for this session
    const stored = getStoredFingerprint();
    if (stored) {
      setDeviceFingerprint(stored);
      return stored;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate fingerprint data
      const fingerprint: DeviceFingerprintData = {
        deviceId: await generateDeviceId(),
        browser: getBrowserInfo(),
        os: getOSInfo(),
        screenRes: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        userAgent: navigator.userAgent,
      };

      // Store in sessionStorage for this session
      storeFingerprint(fingerprint);
      setDeviceFingerprint(fingerprint);

      // Send to backend only once per session
      await fetch('/api/device-fingerprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fingerprint),
      });

      return fingerprint;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate fingerprint';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getStoredFingerprint, storeFingerprint]);

  // Check device history (only when needed)
  const checkDeviceHistory = useCallback(async (): Promise<DeviceAnalysis> => {
    if (!deviceFingerprint) {
      throw new Error('No device fingerprint available');
    }

    try {
      const response = await fetch(`/api/device-fingerprint?deviceId=${deviceFingerprint.deviceId}`);
      if (response.ok) {
        const analysis = await response.json();
        setDeviceAnalysis(analysis);
        return analysis;
      } else {
        throw new Error('Failed to get device analysis');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check device history';
      setError(errorMessage);
      throw error;
    }
  }, [deviceFingerprint]);

  // Track activity (lightweight, no fingerprint regeneration)
  const trackActivity = useCallback(async (action: string, details?: any) => {
    if (!deviceFingerprint) return;

    try {
      await fetch('/api/user-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          action,
          deviceId: deviceFingerprint.deviceId,
          details,
        }),
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [deviceFingerprint, session?.user?.id]);

  // Initialize fingerprint on mount (only once per session)
  useEffect(() => {
    const initFingerprint = async () => {
      // Check if we already have a stored fingerprint
      const stored = getStoredFingerprint();
      if (stored) {
        setDeviceFingerprint(stored);
        return;
      }

      // Generate new fingerprint only if we don't have one
      try {
        await generateFingerprint();
      } catch (error) {
        console.error('Failed to initialize device fingerprint:', error);
      }
    };

    initFingerprint();
  }, [generateFingerprint, getStoredFingerprint]);

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

// Enhanced device ID generation with more entropy
async function generateDeviceId(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    (navigator as any).deviceMemory || 'unknown',
    await generateCanvasFingerprint(),
    await generateWebGLFingerprint(),
    await generateFontFingerprint(),
    await generateAudioFingerprint(),
  ];

  const combined = components.join('|');
  return await simpleHash(combined);
}

// Simple hash function
async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Generate canvas fingerprint
async function generateCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    // Draw some text and shapes
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint test', 2, 2);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillRect(100, 5, 80, 20);

    return canvas.toDataURL();
  } catch (error) {
    return 'canvas-error';
  }
}

// Generate WebGL fingerprint
async function generateWebGLFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const glContext = gl as WebGLRenderingContext;
    const debugInfo = glContext.getExtension('WEBGL_debug_renderer_info');
    
    if (debugInfo) {
      return glContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) + 
             glContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    }
    
    return glContext.getParameter(glContext.VENDOR) + glContext.getParameter(glContext.RENDERER);
  } catch (error) {
    return 'webgl-error';
  }
}

// Generate font fingerprint
async function generateFontFingerprint(): Promise<string> {
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const h = document.getElementsByTagName('body')[0];
  
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const fontList = [
    'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New',
    'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
    'Trebuchet MS', 'Arial Black', 'Impact'
  ];

  let d = document.createElement('div');
  d.style.fontSize = testSize;
  d.innerHTML = testString;
  d.style.position = 'absolute';
  d.style.top = '-9999px';
  d.style.left = '-9999px';
  
  h.appendChild(d);
  
  const baseWidth: Record<string, number> = {};
  const baseHeight: Record<string, number> = {};
  
  for (let baseFont of baseFonts) {
    d.style.fontFamily = baseFont;
    baseWidth[baseFont] = d.offsetWidth;
    baseHeight[baseFont] = d.offsetHeight;
  }
  
  let detectedFonts: string[] = [];
  
  for (let font of fontList) {
    let detected = false;
    for (let baseFont of baseFonts) {
      d.style.fontFamily = `${font},${baseFont}`;
      if (d.offsetWidth !== baseWidth[baseFont] || d.offsetHeight !== baseHeight[baseFont]) {
        detected = true;
        break;
      }
    }
    if (detected) {
      detectedFonts.push(font);
    }
  }
  
  h.removeChild(d);
  return detectedFonts.join(',');
}

// Generate audio fingerprint
async function generateAudioFingerprint(): Promise<string> {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0; // Silent
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(0);

    return audioContext.sampleRate.toString() + 
           analyser.frequencyBinCount.toString() + 
           (audioContext as any).maxChannelCount?.toString() || 'unknown';
  } catch (error) {
    return 'audio-error';
  }
}

// Get browser info
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

// Get OS info
function getOSInfo(): string {
  const userAgent = navigator.userAgent;
  let os = 'Unknown';
  
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'MacOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return os;
} 