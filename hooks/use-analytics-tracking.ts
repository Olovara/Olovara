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
  const { deviceFingerprint, generateFingerprint, checkDeviceHistory, deviceAnalysis } = useDeviceFingerprint();
  const sessionIdRef = useRef<string>(options.sessionId || uuidv4());
  const pageStartTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const mouseMovementsRef = useRef<number>(0);
  const clicksRef = useRef<number>(0);
  const sessionInitializedRef = useRef<boolean>(false);

  // Add debouncing and throttling refs
  const pageViewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pageLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPageViewRef = useRef<string>('');
  const lastPageLeaveRef = useRef<string>('');
  const eventQueueRef = useRef<any[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  
  // Debounce time for page events (milliseconds)
  const PAGE_EVENT_DEBOUNCE = 1000; // 1 second
  const EVENT_FLUSH_INTERVAL = 5000; // 5 seconds

  // Helper function to get client IP (simplified)
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('/api/ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  // Initialize session tracking
  useEffect(() => {
    const initSession = async () => {
      // Prevent multiple initialization attempts
      if (sessionInitializedRef.current) {
        return;
      }

      try {
        sessionInitializedRef.current = true;
        
        await fetch('/api/analytics/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            userId: session?.user?.id,
            deviceId: deviceFingerprint?.deviceId,
            isFirstVisit: !localStorage.getItem('hasVisited'),
            visitNumber: parseInt(localStorage.getItem('visitCount') || '0') + 1,
            returningUser: !!localStorage.getItem('hasVisited'),
          })
        });

        // Update local storage
        localStorage.setItem('hasVisited', 'true');
        localStorage.setItem('visitCount', (parseInt(localStorage.getItem('visitCount') || '0') + 1).toString());
      } catch (error) {
        console.error('Error initializing session:', error);
        // Reset flag on error so we can retry
        sessionInitializedRef.current = false;
      }
    };

    if (deviceFingerprint && !sessionInitializedRef.current) {
      initSession();
    }
  }, [session?.user?.id, deviceFingerprint]);

  // Flush event queue to server
  const flushEventQueue = useCallback(async () => {
    if (eventQueueRef.current.length === 0) {
      return;
    }

    try {
      const eventsToSend = [...eventQueueRef.current];
      eventQueueRef.current = []; // Clear queue

      // Send events in batches
      const batchSize = 10;
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
      eventQueueRef.current.unshift(...eventQueueRef.current);
    } finally {
      flushTimeoutRef.current = null;
    }
  }, []);

  // Debounced page view tracking
  const trackPageView = useCallback(async (pageUrl: string, referrerUrl?: string) => {
    // Skip if same page was recently tracked
    if (lastPageViewRef.current === pageUrl) {
      return;
    }

    // Clear existing timeout
    if (pageViewTimeoutRef.current) {
      clearTimeout(pageViewTimeoutRef.current);
    }

    // Set new timeout
    pageViewTimeoutRef.current = setTimeout(async () => {
      try {
        lastPageViewRef.current = pageUrl;
        
        const eventData = {
          sessionId: sessionIdRef.current,
          eventType: 'PAGE_VIEW' as const,
          pageUrl,
          referrerUrl: referrerUrl || '',
          timestamp: new Date().toISOString(),
          deviceId: deviceFingerprint?.deviceId,
          ipAddress: await getClientIP(),
          userAgent: navigator.userAgent,
          isFirstVisit: !localStorage.getItem('hasVisited'),
          visitNumber: parseInt(localStorage.getItem('visitCount') || '0'),
          sessionDuration: Date.now() - sessionStartTimeRef.current,
        };

        // Add to queue instead of immediate send
        eventQueueRef.current.push(eventData);
        
        // Schedule flush if not already scheduled
        if (!flushTimeoutRef.current) {
          flushTimeoutRef.current = setTimeout(flushEventQueue, EVENT_FLUSH_INTERVAL);
        }
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    }, PAGE_EVENT_DEBOUNCE);
  }, [deviceFingerprint?.deviceId, flushEventQueue]);

  // Track user interaction
  const trackInteraction = useCallback(async (data: {
    eventType: string;
    elementId?: string;
    elementType?: string;
    elementText?: string;
    interactionData?: any;
  }) => {
    try {
      await fetch('/api/analytics/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          pageUrl: window.location.href,
          referrerUrl: document.referrer,
          userId: session?.user?.id,
          deviceId: deviceFingerprint?.deviceId,
          timestamp: new Date().toISOString(),
          ...data,
        })
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }, [session?.user?.id, deviceFingerprint]);

  // Track search
  const trackSearch = useCallback(async (data: {
    query: string;
    searchType: string;
    filters?: any;
    sortBy?: string;
    resultsCount: number;
    resultsShown: number;
    searchTime?: number;
  }) => {
    try {
      const response = await fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userId: session?.user?.id,
          deviceId: deviceFingerprint?.deviceId,
          timestamp: new Date().toISOString(),
          ...data,
        })
      });

      const result = await response.json();
      return result.searchId; // Return search ID for click tracking
    } catch (error) {
      console.error('Error tracking search:', error);
      return null;
    }
  }, [session?.user?.id, deviceFingerprint]);

  // Track search click
  const trackSearchClick = useCallback(async (data: {
    searchId: string;
    clickedResult: number;
    clickedProductId?: string;
    clickedSellerId?: string;
    timeToClick?: number;
  }) => {
    try {
      await fetch('/api/analytics/search/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error tracking search click:', error);
    }
  }, []);

  // Track product interaction
  const trackProductInteraction = useCallback(async (data: {
    productId: string;
    interactionType: string;
    interactionData?: any;
    timeOnProduct?: number;
    imagesViewed?: number;
    descriptionRead?: boolean;
    reviewsViewed?: number;
    sellerInfoViewed?: boolean;
    sourceType?: string;
    sourceId?: string;
  }) => {
    try {
      await fetch('/api/analytics/product-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userId: session?.user?.id,
          deviceId: deviceFingerprint?.deviceId,
          referrerUrl: document.referrer,
          timestamp: new Date().toISOString(),
          ...data,
        })
      });
    } catch (error) {
      console.error('Error tracking product interaction:', error);
    }
  }, [session?.user?.id, deviceFingerprint]);

  // Track scroll depth
  const trackScrollDepth = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;
    
    if (scrollPercentage > scrollDepthRef.current) {
      scrollDepthRef.current = scrollPercentage;
      
      // Track significant scroll milestones
      if (scrollPercentage >= 25 && scrollPercentage < 50) {
        trackInteraction({ eventType: 'SCROLL', interactionData: { depth: 25 } });
      } else if (scrollPercentage >= 50 && scrollPercentage < 75) {
        trackInteraction({ eventType: 'SCROLL', interactionData: { depth: 50 } });
      } else if (scrollPercentage >= 75 && scrollPercentage < 100) {
        trackInteraction({ eventType: 'SCROLL', interactionData: { depth: 75 } });
      } else if (scrollPercentage >= 100) {
        trackInteraction({ eventType: 'SCROLL', interactionData: { depth: 100 } });
      }
    }
  }, [trackInteraction]);

  // Track mouse movements
  const trackMouseMovement = useCallback(() => {
    mouseMovementsRef.current++;
    
    // Track every 10 mouse movements
    if (mouseMovementsRef.current % 10 === 0) {
      trackInteraction({ 
        eventType: 'MOUSE_MOVEMENT', 
        interactionData: { count: mouseMovementsRef.current } 
      });
    }
  }, [trackInteraction]);

  // Throttled click tracking
  const trackClick = useCallback((event: MouseEvent) => {
    clicksRef.current++;
    
    // Only track significant clicks (not every single one)
    if (clicksRef.current % 5 === 0) { // Track every 5th click
      const target = event.target as HTMLElement;
      const elementId = target.id || target.className || target.tagName;
      const elementType = target.tagName.toLowerCase();
      const elementText = target.textContent?.trim().substring(0, 100);
      
      const eventData = {
        sessionId: sessionIdRef.current,
        eventType: 'CLICK' as const,
        pageUrl: window.location.href,
        referrerUrl: document.referrer,
        elementId,
        elementType,
        elementText,
        timestamp: new Date().toISOString(),
        deviceId: deviceFingerprint?.deviceId,
        ipAddress: 'unknown', // Will be filled by server
        userAgent: navigator.userAgent,
        isFirstVisit: !localStorage.getItem('hasVisited'),
        visitNumber: parseInt(localStorage.getItem('visitCount') || '0'),
        sessionDuration: Date.now() - sessionStartTimeRef.current,
      };

      eventQueueRef.current.push(eventData);
      
      if (!flushTimeoutRef.current) {
        flushTimeoutRef.current = setTimeout(flushEventQueue, EVENT_FLUSH_INTERVAL);
      }
    }
  }, [deviceFingerprint?.deviceId, flushEventQueue]);

  // Debounced page leave tracking
  const trackPageLeave = useCallback(async (pageUrl: string, timeOnPage?: number) => {
    // Skip if same page was recently tracked
    if (lastPageLeaveRef.current === pageUrl) {
      return;
    }

    // Clear existing timeout
    if (pageLeaveTimeoutRef.current) {
      clearTimeout(pageLeaveTimeoutRef.current);
    }

    // Set new timeout
    pageLeaveTimeoutRef.current = setTimeout(async () => {
      try {
        lastPageLeaveRef.current = pageUrl;
        
        const eventData = {
          sessionId: sessionIdRef.current,
          eventType: 'PAGE_LEAVE' as const,
          pageUrl,
          referrerUrl: '',
          interactionData: {
            timeOnPage: timeOnPage || Date.now() - sessionStartTimeRef.current,
            scrollDepth: scrollDepthRef.current,
            mouseMovements: mouseMovementsRef.current,
            clicks: clicksRef.current,
          },
          timestamp: new Date().toISOString(),
          deviceId: deviceFingerprint?.deviceId,
          ipAddress: await getClientIP(),
          userAgent: navigator.userAgent,
          isFirstVisit: !localStorage.getItem('hasVisited'),
          visitNumber: parseInt(localStorage.getItem('visitCount') || '0'),
          sessionDuration: Date.now() - sessionStartTimeRef.current,
        };

        // Add to queue instead of immediate send
        eventQueueRef.current.push(eventData);
        
        // Schedule flush if not already scheduled
        if (!flushTimeoutRef.current) {
          flushTimeoutRef.current = setTimeout(flushEventQueue, EVENT_FLUSH_INTERVAL);
        }
      } catch (error) {
        console.error('Error tracking page leave:', error);
      }
    }, PAGE_EVENT_DEBOUNCE);
  }, [deviceFingerprint?.deviceId]);

  // Set up event listeners
  useEffect(() => {
    // Track initial page view
    trackPageView(window.location.href, document.referrer);
    
    // Set up scroll tracking
    window.addEventListener('scroll', trackScrollDepth);
    
    // Set up mouse movement tracking
    window.addEventListener('mousemove', trackMouseMovement);
    
    // Set up click tracking
    document.addEventListener('click', trackClick);
    
    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - track time on page
        const timeOnPage = Date.now() - pageStartTimeRef.current;
        trackPageLeave(window.location.href, timeOnPage);
      } else {
        // Page visible - reset timer
        pageStartTimeRef.current = Date.now();
        trackInteraction({ eventType: 'PAGE_VISIBLE' });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Capture ref values at the time the effect runs
    const currentPageStartTime = pageStartTimeRef.current;
    const currentScrollDepth = scrollDepthRef.current;
    const currentMouseMovements = mouseMovementsRef.current;
    const currentClicks = clicksRef.current;
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('scroll', trackScrollDepth);
      window.removeEventListener('mousemove', trackMouseMovement);
      document.removeEventListener('click', trackClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Track final page view metrics using captured values
      const timeOnPage = Date.now() - currentPageStartTime;
      trackPageLeave(window.location.href, timeOnPage);
    };
  }, [trackPageView, trackScrollDepth, trackMouseMovement, trackClick, trackInteraction, trackPageLeave]);

  return {
    sessionId: sessionIdRef.current,
    trackPageView,
    trackInteraction,
    trackSearch,
    trackSearchClick,
    trackProductInteraction,
  };
}

// Specialized hooks for common use cases
export function useProductTracking(productId: string, sourceType?: string, sourceId?: string) {
  const { trackProductInteraction } = useAnalyticsTracking();
  
  const trackProductView = useCallback(() => {
    trackProductInteraction({
      productId,
      interactionType: 'VIEW',
      sourceType,
      sourceId,
    });
  }, [productId, sourceType, sourceId, trackProductInteraction]);

  const trackAddToCart = useCallback((quantity: number = 1) => {
    trackProductInteraction({
      productId,
      interactionType: 'ADD_TO_CART',
      interactionData: { quantity },
      sourceType,
      sourceId,
    });
  }, [productId, sourceType, sourceId, trackProductInteraction]);

  const trackProductClick = useCallback(() => {
    trackProductInteraction({
      productId,
      interactionType: 'CLICK',
      sourceType,
      sourceId,
    });
  }, [productId, sourceType, sourceId, trackProductInteraction]);

  const trackProductShare = useCallback((platform: string) => {
    trackProductInteraction({
      productId,
      interactionType: 'SHARE',
      interactionData: { platform },
      sourceType,
      sourceId,
    });
  }, [productId, sourceType, sourceId, trackProductInteraction]);

  return {
    trackProductView,
    trackAddToCart,
    trackProductClick,
    trackProductShare,
  };
}

export function useSearchTracking() {
  const { trackSearch, trackSearchClick } = useAnalyticsTracking();
  
  const trackSearchQuery = useCallback(async (data: {
    query: string;
    searchType: string;
    filters?: any;
    sortBy?: string;
    resultsCount: number;
    resultsShown: number;
    searchTime?: number;
  }) => {
    return await trackSearch(data);
  }, [trackSearch]);

  const trackSearchResultClick = useCallback(async (data: {
    searchId: string;
    clickedResult: number;
    clickedProductId?: string;
    clickedSellerId?: string;
    timeToClick?: number;
  }) => {
    await trackSearchClick(data);
  }, [trackSearchClick]);

  return {
    trackSearchQuery,
    trackSearchResultClick,
  };
} 