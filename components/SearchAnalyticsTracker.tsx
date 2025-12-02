"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Client-side component to track search analytics
 * Sends search data to the API when a search query is detected
 */
export function SearchAnalyticsTracker({ 
  resultCount,
  searchContext = "global search bar"
}: { 
  resultCount: number;
  searchContext?: string;
}) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");
  const hasTrackedRef = useRef<string | null>(null); // Track what we've already sent

  useEffect(() => {
    // Only track if there's a search query
    if (!searchQuery || searchQuery.trim().length === 0) {
      return;
    }

    // Prevent duplicate tracking - create a unique key for this search
    const trackingKey = `${searchQuery.trim()}_${resultCount}_${searchContext}`;
    if (hasTrackedRef.current === trackingKey) {
      return; // Already tracked this exact search
    }

    // Get device ID from cookie or localStorage
    const getDeviceId = (): string => {
      // Try to get from cookie first
      const cookies = document.cookie.split(';');
      const deviceCookie = cookies.find(c => c.trim().startsWith('deviceId='));
      if (deviceCookie) {
        return deviceCookie.split('=')[1];
      }

      // Try localStorage
      const stored = localStorage.getItem('deviceId');
      if (stored) {
        return stored;
      }

      // Generate new device ID if none exists
      const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Store in both cookie (expires in 1 year) and localStorage
      document.cookie = `deviceId=${newDeviceId}; path=/; max-age=${365 * 24 * 60 * 60}`;
      localStorage.setItem('deviceId', newDeviceId);
      
      return newDeviceId;
    };

    // Get session ID if available
    const getSessionId = (): string | null => {
      return sessionStorage.getItem('sessionId') || null;
    };

    // Determine device type
    const getDeviceType = (): string => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'))) {
          return 'tablet';
        }
        return 'mobile';
      }
      return 'desktop';
    };

    // Track the search
    const trackSearch = async () => {
      try {
        const deviceId = getDeviceId();
        const sessionId = getSessionId();
        const deviceType = getDeviceType();

        const response = await fetch('/api/analytics/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            searchQuery: searchQuery.trim(),
            resultCount,
            deviceId,
            sessionId,
            deviceType,
            searchContext,
          }),
        });

        // Only mark as tracked if the request was successful
        if (response.ok) {
          hasTrackedRef.current = trackingKey;
        }
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.warn('Failed to track search analytics:', error);
      }
    };

    // Small delay to ensure page is fully loaded
    const timeoutId = setTimeout(trackSearch, 100);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, resultCount, searchContext]);

  // This component doesn't render anything
  return null;
}

