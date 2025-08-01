'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useDeviceFingerprint } from './use-device-fingerprint';
import { v4 as uuidv4 } from 'uuid';

interface AnalyticsTrackingOptions {
  sessionId?: string;
  pageUrl?: string;
  referrerUrl?: string;
}

export function useAnalyticsTracking(options: AnalyticsTrackingOptions = {}) {
  const { data: session } = useSession();
  const { deviceFingerprint } = useDeviceFingerprint();
  
  const sessionIdRef = useRef<string | null>(null);
  const eventQueueRef = useRef<any[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollDepthRef = useRef<number>(0);
  const mouseMovementsRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);
  const lastFlushTimeRef = useRef<number>(0);

  const EVENT_FLUSH_INTERVAL = 60000; // Increased from 30 seconds to 60 seconds
  const MIN_ACTIVITY_INTERVAL = 5000; // Minimum 5 seconds between activity tracking
  const MAX_QUEUE_SIZE = 50; // Reduced from 100 to 50

  // Get client IP address
  const getClientIP = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      console.error('Error getting client IP:', error);
      return 'unknown';
    }
  }, []);

  // Initialize session
  const initSession = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      const clientIP = await getClientIP();
      
      const response = await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          deviceId: deviceFingerprint?.deviceId,
          ipAddress: clientIP,
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
          referrerUrl: document.referrer,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionIdRef.current = data.sessionId;
        isInitializedRef.current = true;
      }
    } catch (error) {
      console.error('Error initializing analytics session:', error);
    }
  }, [session?.user?.id, deviceFingerprint, getClientIP]);

  // Flush event queue to server
  const flushEventQueue = useCallback(async () => {
    if (eventQueueRef.current.length === 0) {
      return;
    }

    // Prevent too frequent flushes
    const now = Date.now();
    if (now - lastFlushTimeRef.current < 10000) { // Minimum 10 seconds between flushes
      return;
    }

    const eventsToSend = [...eventQueueRef.current];
    eventQueueRef.current = []; // Clear queue
    lastFlushTimeRef.current = now;

    try {
      // Send events in batches
      const batchSize = 3; // Reduced from 5 to 3
      for (let i = 0; i < eventsToSend.length; i += batchSize) {
        const batch = eventsToSend.slice(i, i + batchSize);
        
        await fetch('/api/analytics/behavior', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: batch }),
        });
      }
    } catch (error) {
      console.error('Error flushing event queue:', error);
      // Re-add events to queue on error
      eventQueueRef.current.unshift(...eventsToSend);
    } finally {
      flushTimeoutRef.current = null;
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(async (url: string, referrer?: string) => {
    if (!sessionIdRef.current) return;

    try {
      await fetch('/api/analytics/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          pageUrl: url,
          referrerUrl: referrer || document.referrer,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }, []);

  // Track user interaction
  const trackInteraction = useCallback(async (data: {
    eventType: string;
    elementId?: string;
    elementType?: string;
    elementText?: string;
    interactionData?: any;
  }) => {
    // Prevent too frequent tracking
    const now = Date.now();
    if (now - lastActivityRef.current < MIN_ACTIVITY_INTERVAL) {
      return;
    }
    lastActivityRef.current = now;

    try {
      const eventData = {
        sessionId: sessionIdRef.current,
        pageUrl: window.location.href,
        referrerUrl: document.referrer,
        userId: session?.user?.id,
        deviceId: deviceFingerprint?.deviceId,
        timestamp: new Date().toISOString(),
        ...data,
      };

      // Add to queue instead of immediate send
      eventQueueRef.current.push(eventData);
      
      // Limit queue size to prevent memory issues
      if (eventQueueRef.current.length > MAX_QUEUE_SIZE) {
        eventQueueRef.current = eventQueueRef.current.slice(-25); // Keep last 25 events
      }
      
      // Schedule flush if not already scheduled
      if (!flushTimeoutRef.current) {
        flushTimeoutRef.current = setTimeout(flushEventQueue, EVENT_FLUSH_INTERVAL);
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }, [session?.user?.id, deviceFingerprint, flushEventQueue]);

  // Track scroll depth with reduced frequency
  const trackScrollDepth = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;
    
    if (scrollPercentage > scrollDepthRef.current) {
      scrollDepthRef.current = scrollPercentage;
      
      // Track significant scroll milestones (only once per milestone with longer intervals)
      if (scrollPercentage >= 25 && scrollPercentage < 50 && scrollDepthRef.current < 50) {
        trackInteraction({ eventType: 'SCROLL', interactionData: { depth: 25 } });
      } else if (scrollPercentage >= 50 && scrollPercentage < 75 && scrollDepthRef.current < 75) {
        trackInteraction({ eventType: 'SCROLL', interactionData: { depth: 50 } });
      } else if (scrollPercentage >= 75 && scrollPercentage < 100 && scrollDepthRef.current < 100) {
        trackInteraction({ eventType: 'SCROLL', interactionData: { depth: 75 } });
      } else if (scrollPercentage >= 100 && scrollDepthRef.current < 101) {
        trackInteraction({ eventType: 'SCROLL', interactionData: { depth: 100 } });
      }
    }
  }, [trackInteraction]);

  // Track mouse movements with much reduced frequency
  const trackMouseMovement = useCallback(() => {
    mouseMovementsRef.current++;
    
    // Track every 100 mouse movements instead of 50
    if (mouseMovementsRef.current % 100 === 0) {
      trackInteraction({ 
        eventType: 'MOUSE_MOVEMENT', 
        interactionData: { count: mouseMovementsRef.current } 
      });
    }
  }, [trackInteraction]);

  // Track clicks
  const trackClick = useCallback((elementId?: string, elementType?: string, elementText?: string) => {
    trackInteraction({
      eventType: 'CLICK',
      elementId,
      elementType,
      elementText,
    });
  }, [trackInteraction]);

  // Track page leave
  const trackPageLeave = useCallback(() => {
    if (sessionIdRef.current) {
      trackInteraction({ eventType: 'PAGE_LEAVE' });
    }
  }, [trackInteraction]);

  // Initialize on mount
  useEffect(() => {
    if (!isInitializedRef.current && deviceFingerprint) {
      initSession();
    }
  }, [deviceFingerprint, initSession]);

  // Set up event listeners
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const handleScroll = () => trackScrollDepth();
    const handleMouseMove = () => trackMouseMovement();
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      trackClick(target.id, target.tagName.toLowerCase(), target.textContent?.slice(0, 50));
    };
    const handleBeforeUnload = () => trackPageLeave();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('click', handleClick);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Flush remaining events
      if (eventQueueRef.current.length > 0) {
        flushEventQueue();
      }
    };
  }, [trackScrollDepth, trackMouseMovement, trackClick, trackPageLeave, flushEventQueue]);

  return {
    trackPageView,
    trackInteraction,
    trackClick,
    trackScrollDepth,
    trackMouseMovement,
    trackPageLeave,
    sessionId: sessionIdRef.current,
  };
} 