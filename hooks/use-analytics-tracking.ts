"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useDeviceFingerprint } from "./use-device-fingerprint";
import { v4 as uuidv4 } from "uuid";

interface AnalyticsTrackingOptions {
  sessionId?: string;
  pageUrl?: string;
  referrerUrl?: string;
}

interface MouseMovementData {
  x: number;
  y: number;
  timestamp: number;
}

interface ScrollData {
  depth: number;
  timestamp: number;
}

interface BehaviorSummary {
  mouseMovements: number;
  avgVelocity: number;
  movementPattern: "NATURAL" | "LINEAR" | "RANDOM" | "GRID";
  riskScore: number;
  scrollDepth: number;
  scrollSessions: number;
  timeOnPage: number;
  clicks: number;
  uniqueElements: string[];
}

export function useAnalyticsTracking(options: AnalyticsTrackingOptions = {}) {
  const { data: session } = useSession();
  const { deviceFingerprint } = useDeviceFingerprint();

  const sessionIdRef = useRef<string | null>(null);
  const eventQueueRef = useRef<any[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);
  const lastFlushTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(0);

  // Behavior tracking refs
  const mouseBufferRef = useRef<MouseMovementData[]>([]);
  const scrollBufferRef = useRef<ScrollData[]>([]);
  const clicksRef = useRef<Set<string>>(new Set());
  const lastMouseSendRef = useRef<number>(0);
  const lastScrollSendRef = useRef<number>(0);
  const pageStartTimeRef = useRef<number>(0);

  const EVENT_FLUSH_INTERVAL = 30000; // 30 seconds - more frequent but batched
  const MIN_ACTIVITY_INTERVAL = 2000; // 2 seconds between activity tracking
  const MAX_QUEUE_SIZE = 100; // Larger queue for better batching
  const MOUSE_SEND_INTERVAL = 2000; // Send mouse data every 2 seconds
  const SCROLL_SEND_INTERVAL = 3000; // Send scroll data every 3 seconds

  // Get client IP address (only once per session)
  const getClientIP = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch("/api/ip");
      const data = await response.json();
      return data.ip || "unknown";
    } catch (error) {
      console.error("Error getting client IP:", error);
      return "unknown";
    }
  }, []);

  // Initialize session (fingerprint once, create session once)
  const initSession = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      const clientIP = await getClientIP();
      sessionStartTimeRef.current = Date.now();
      pageStartTimeRef.current = Date.now();

      const response = await fetch("/api/analytics/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      console.error("Error initializing analytics session:", error);
    }
  }, [session?.user?.id, deviceFingerprint, getClientIP]);

  // Analyze mouse movement pattern
  const analyzeMousePattern = useCallback(
    (
      movements: MouseMovementData[]
    ): {
      pattern: "NATURAL" | "LINEAR" | "RANDOM" | "GRID";
      avgVelocity: number;
      riskScore: number;
    } => {
      if (movements.length < 3) {
        return { pattern: "NATURAL", avgVelocity: 0, riskScore: 0.1 };
      }

      // Calculate velocities
      const velocities: number[] = [];
      for (let i = 1; i < movements.length; i++) {
        const dx = movements[i].x - movements[i - 1].x;
        const dy = movements[i].y - movements[i - 1].y;
        const dt = movements[i].timestamp - movements[i - 1].timestamp;
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
        velocities.push(velocity);
      }

      const avgVelocity =
        velocities.reduce((a, b) => a + b, 0) / velocities.length;

      // Detect patterns
      let linearCount = 0;
      let gridCount = 0;
      let naturalCount = 0;

      for (let i = 2; i < movements.length; i++) {
        const dx1 = movements[i - 1].x - movements[i - 2].x;
        const dy1 = movements[i - 1].y - movements[i - 2].y;
        const dx2 = movements[i].x - movements[i - 1].x;
        const dy2 = movements[i].y - movements[i - 1].y;

        // Check for linear movement
        if (Math.abs(dx1 - dx2) < 2 && Math.abs(dy1 - dy2) < 2) {
          linearCount++;
        }

        // Check for grid-like movement (snapping to grid)
        if (dx1 % 10 === 0 && dy1 % 10 === 0) {
          gridCount++;
        }

        // Natural movement has varied velocities
        if (velocities[i - 1] > 0.1 && velocities[i - 1] < 5) {
          naturalCount++;
        }
      }

      // Determine pattern
      let pattern: "NATURAL" | "LINEAR" | "RANDOM" | "GRID" = "NATURAL";
      let riskScore = 0.1;

      if (gridCount > movements.length * 0.3) {
        pattern = "GRID";
        riskScore = 0.8;
      } else if (linearCount > movements.length * 0.5) {
        pattern = "LINEAR";
        riskScore = 0.6;
      } else if (naturalCount < movements.length * 0.3) {
        pattern = "RANDOM";
        riskScore = 0.4;
      }

      return { pattern, avgVelocity, riskScore };
    },
    []
  );

  // Send behavior summary
  const sendBehaviorSummary = useCallback(
    async (summary: BehaviorSummary) => {
      try {
        await fetch("/api/analytics/behavior", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: [
              {
                eventType: "BEHAVIOR_SUMMARY",
                sessionId: sessionIdRef.current,
                userId: session?.user?.id,
                deviceId: deviceFingerprint?.deviceId,
                timestamp: new Date().toISOString(),
                pageUrl: window.location.href,
                referrerUrl: document.referrer,
                interactionData: summary,
              },
            ],
            sessionId: sessionIdRef.current,
            deviceId: deviceFingerprint?.deviceId,
          }),
        });
      } catch (error) {
        console.error("Error sending behavior summary:", error);
      }
    },
    [session?.user?.id, deviceFingerprint]
  );

  // Process mouse movements
  const processMouseMovements = useCallback(() => {
    const now = Date.now();
    if (
      now - lastMouseSendRef.current < MOUSE_SEND_INTERVAL ||
      mouseBufferRef.current.length === 0
    ) {
      return;
    }

    const movements = [...mouseBufferRef.current];
    mouseBufferRef.current = [];
    lastMouseSendRef.current = now;

    const { pattern, avgVelocity, riskScore } = analyzeMousePattern(movements);

    const summary: BehaviorSummary = {
      mouseMovements: movements.length,
      avgVelocity,
      movementPattern: pattern,
      riskScore,
      scrollDepth: 0,
      scrollSessions: 0,
      timeOnPage: now - pageStartTimeRef.current,
      clicks: clicksRef.current.size,
      uniqueElements: Array.from(clicksRef.current),
    };

    sendBehaviorSummary(summary);
  }, [analyzeMousePattern, sendBehaviorSummary]);

  // Process scroll data
  const processScrollData = useCallback(() => {
    const now = Date.now();
    if (
      now - lastScrollSendRef.current < SCROLL_SEND_INTERVAL ||
      scrollBufferRef.current.length === 0
    ) {
      return;
    }

    const scrolls = [...scrollBufferRef.current];
    scrollBufferRef.current = [];
    lastScrollSendRef.current = now;

    const maxDepth = Math.max(...scrolls.map((s) => s.depth));
    const scrollSessions = scrolls.length;

    const summary: BehaviorSummary = {
      mouseMovements: 0,
      avgVelocity: 0,
      movementPattern: "NATURAL",
      riskScore: 0.1,
      scrollDepth: maxDepth,
      scrollSessions,
      timeOnPage: now - pageStartTimeRef.current,
      clicks: clicksRef.current.size,
      uniqueElements: Array.from(clicksRef.current),
    };

    sendBehaviorSummary(summary);
  }, [sendBehaviorSummary]);

  // Flush event queue to server (batched)
  const flushEventQueue = useCallback(async () => {
    if (eventQueueRef.current.length === 0) {
      return;
    }

    // Prevent too frequent flushes
    const now = Date.now();
    if (now - lastFlushTimeRef.current < 5000) {
      // Minimum 5 seconds between flushes
      return;
    }

    const eventsToSend = [...eventQueueRef.current];
    eventQueueRef.current = []; // Clear queue
    lastFlushTimeRef.current = now;

    try {
      // Send all events in one batch
      await fetch("/api/analytics/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: eventsToSend,
          sessionId: sessionIdRef.current,
          deviceId: deviceFingerprint?.deviceId,
        }),
      });
    } catch (error) {
      console.error("Error flushing event queue:", error);
      // Re-add events to queue on error
      eventQueueRef.current.unshift(...eventsToSend);
    } finally {
      flushTimeoutRef.current = null;
    }
  }, [deviceFingerprint]);

  // Track page view (update session, don't create new events)
  const trackPageView = useCallback(async (url: string, referrer?: string) => {
    if (!sessionIdRef.current) return;

    try {
      await fetch("/api/analytics/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          pageUrl: url,
          referrerUrl: referrer || document.referrer,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Error tracking page view:", error);
    }
  }, []);

  // Track user interaction (queued, batched)
  const trackInteraction = useCallback(
    async (data: {
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
          eventQueueRef.current = eventQueueRef.current.slice(-50); // Keep last 50 events
        }

        // Schedule flush if not already scheduled
        if (!flushTimeoutRef.current) {
          flushTimeoutRef.current = setTimeout(
            flushEventQueue,
            EVENT_FLUSH_INTERVAL
          );
        }
      } catch (error) {
        console.error("Error tracking interaction:", error);
      }
    },
    [session?.user?.id, deviceFingerprint, flushEventQueue]
  );

  // Track mouse movements (buffered and analyzed)
  const trackMouseMovement = useCallback(
    (e: MouseEvent) => {
      mouseBufferRef.current.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      });

      // Process if buffer is getting large or enough time has passed
      if (mouseBufferRef.current.length >= 50) {
        processMouseMovements();
      }
    },
    [processMouseMovements]
  );

  // Track scroll depth (buffered and analyzed)
  const trackScrollDepth = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;

    scrollBufferRef.current.push({
      depth: scrollPercentage,
      timestamp: Date.now(),
    });

    // Process if buffer is getting large or enough time has passed
    if (scrollBufferRef.current.length >= 20) {
      processScrollData();
    }
  }, [processScrollData]);

  // Track clicks (tracked for summary)
  const trackClick = useCallback(
    (elementId?: string, elementType?: string, elementText?: string) => {
      const elementKey = `${elementType}:${elementId || elementText?.slice(0, 20)}`;
      clicksRef.current.add(elementKey);

      trackInteraction({
        eventType: "CLICK",
        elementId,
        elementType,
        elementText,
      });
    },
    [trackInteraction]
  );

  // Track page leave
  const trackPageLeave = useCallback(() => {
    if (sessionIdRef.current) {
      // Send final behavior summary
      const finalSummary: BehaviorSummary = {
        mouseMovements: mouseBufferRef.current.length,
        avgVelocity: 0,
        movementPattern: "NATURAL",
        riskScore: 0.1,
        scrollDepth: Math.max(
          ...scrollBufferRef.current.map((s) => s.depth),
          0
        ),
        scrollSessions: scrollBufferRef.current.length,
        timeOnPage: Date.now() - pageStartTimeRef.current,
        clicks: clicksRef.current.size,
        uniqueElements: Array.from(clicksRef.current),
      };

      sendBehaviorSummary(finalSummary);
      trackInteraction({ eventType: "PAGE_LEAVE" });
    }
  }, [trackInteraction, sendBehaviorSummary]);

  // Track product interaction (queued, not immediate API call)
  const trackProductInteraction = useCallback(
    (data: {
      productId: string;
      interactionType: string;
      interactionData?: any;
      sourceType?: string;
      sourceId?: string;
    }) => {
      trackInteraction({
        eventType: "PRODUCT_INTERACTION",
        interactionData: data,
      });
    },
    [trackInteraction]
  );

  // Track shop interaction (queued) - views and buyer actions on shop pages
  const trackShopInteraction = useCallback(
    (data: {
      sellerId: string;
      interactionType: string;
      interactionData?: any;
      timeOnShop?: number;
      productsViewed?: number;
      policiesViewed?: boolean;
      aboutViewed?: boolean;
      sourceType?: string;
      sourceId?: string;
    }) => {
      trackInteraction({
        eventType: "SHOP_INTERACTION",
        interactionData: data,
      });
    },
    [trackInteraction]
  );

  // Track purchase intent (queued, not immediate API call)
  const trackPurchaseIntent = useCallback(
    (data: {
      productId: string;
      sellerId: string;
      amount: number;
      currency: string;
      step:
        | "VIEWED"
        | "ADDED_TO_CART"
        | "CHECKOUT_STARTED"
        | "PAYMENT_ATTEMPTED"
        | "SUCCESS"
        | "FAILED";
      failureReason?: string;
    }) => {
      trackInteraction({
        eventType: "PURCHASE_INTENT",
        interactionData: data,
      });
    },
    [trackInteraction]
  );

  // Track custom order events (queued, not immediate API call)
  const trackCustomOrderEvent = useCallback(
    (data: {
      sellerId: string;
      action:
        | "STARTED"
        | "FORM_COMPLETED"
        | "PAYMENT_ATTEMPTED"
        | "SUCCESS"
        | "FAILED";
      formId?: string;
      amount?: number;
      failureReason?: string;
    }) => {
      trackInteraction({
        eventType: "CUSTOM_ORDER",
        interactionData: data,
      });
    },
    [trackInteraction]
  );

  // Track click-through rates (queued, not immediate API call)
  const trackClickThrough = useCallback(
    (data: {
      elementId: string;
      elementType: string;
      productId?: string;
      sellerId?: string;
    }) => {
      trackInteraction({
        eventType: "CLICK_THROUGH",
        elementId: data.elementId,
        elementType: data.elementType,
        interactionData: {
          productId: data.productId,
          sellerId: data.sellerId,
        },
      });
    },
    [trackInteraction]
  );

  // Track registration patterns (queued, not immediate API call)
  const trackRegistrationPattern = useCallback(
    (data: {
      email: string;
      action:
        | "REGISTRATION_ATTEMPT"
        | "REGISTRATION_SUCCESS"
        | "REGISTRATION_FAILED";
      failureReason?: string;
      isReturningIP?: boolean;
      isReturningDevice?: boolean;
    }) => {
      trackInteraction({
        eventType: "REGISTRATION_PATTERN",
        interactionData: data,
      });
    },
    [trackInteraction]
  );

  // Initialize on mount (fingerprint once)
  useEffect(() => {
    if (!isInitializedRef.current && deviceFingerprint) {
      initSession();
    }
  }, [deviceFingerprint, initSession]);

  // Set up event listeners
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const handleMouseMove = (e: MouseEvent) => trackMouseMovement(e);
    const handleScroll = () => trackScrollDepth();
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      trackClick(
        target.id,
        target.tagName.toLowerCase(),
        target.textContent?.slice(0, 50)
      );
    };
    const handleBeforeUnload = () => trackPageLeave();

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleClick);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Periodic processing of buffers
    const mouseInterval = setInterval(
      processMouseMovements,
      MOUSE_SEND_INTERVAL
    );
    const scrollInterval = setInterval(processScrollData, SCROLL_SEND_INTERVAL);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      clearInterval(mouseInterval);
      clearInterval(scrollInterval);

      // Flush remaining events
      if (eventQueueRef.current.length > 0) {
        flushEventQueue();
      }
    };
  }, [
    trackMouseMovement,
    trackScrollDepth,
    trackClick,
    trackPageLeave,
    flushEventQueue,
    processMouseMovements,
    processScrollData,
  ]);

  return {
    sessionId: sessionIdRef.current,
    trackPageView,
    trackInteraction,
    trackProductInteraction,
    trackShopInteraction,
    trackPurchaseIntent,
    trackCustomOrderEvent,
    trackClickThrough,
    trackRegistrationPattern,
  };
}

// Specialized hooks for common use cases
export function useProductTracking(
  productId: string,
  sourceType?: string,
  sourceId?: string
) {
  const { trackProductInteraction } = useAnalyticsTracking();

  const trackProductView = useCallback(() => {
    trackProductInteraction({
      productId,
      interactionType: "VIEW",
      sourceType,
      sourceId,
    });
  }, [productId, sourceType, sourceId, trackProductInteraction]);

  const trackAddToCart = useCallback(
    (quantity: number = 1) => {
      trackProductInteraction({
        productId,
        interactionType: "ADD_TO_CART",
        interactionData: { quantity },
        sourceType,
        sourceId,
      });
    },
    [productId, sourceType, sourceId, trackProductInteraction]
  );

  const trackProductClick = useCallback(() => {
    trackProductInteraction({
      productId,
      interactionType: "CLICK",
      sourceType,
      sourceId,
    });
  }, [productId, sourceType, sourceId, trackProductInteraction]);

  return {
    trackProductView,
    trackAddToCart,
    trackProductClick,
  };
}

/** Hook for tracking shop page views and buyer actions (for analytics) */
export function useShopTracking(
  sellerId: string,
  sourceType?: string,
  sourceId?: string
) {
  const { trackShopInteraction } = useAnalyticsTracking();

  const trackShopView = useCallback(() => {
    trackShopInteraction({
      sellerId,
      interactionType: "VIEW",
      sourceType,
      sourceId,
    });
  }, [sellerId, sourceType, sourceId, trackShopInteraction]);

  const trackShopAction = useCallback(
    (action: string, interactionData?: any) => {
      trackShopInteraction({
        sellerId,
        interactionType: action,
        interactionData,
        sourceType,
        sourceId,
      });
    },
    [sellerId, sourceType, sourceId, trackShopInteraction]
  );

  return { trackShopView, trackShopAction, trackShopInteraction };
}

export function usePurchaseTracking() {
  const { trackPurchaseIntent } = useAnalyticsTracking();

  const trackProductViewed = useCallback(
    (
      productId: string,
      sellerId: string,
      amount: number,
      currency: string = "USD"
    ) => {
      trackPurchaseIntent({
        productId,
        sellerId,
        amount,
        currency,
        step: "VIEWED",
      });
    },
    [trackPurchaseIntent]
  );

  const trackAddedToCart = useCallback(
    (
      productId: string,
      sellerId: string,
      amount: number,
      currency: string = "USD"
    ) => {
      trackPurchaseIntent({
        productId,
        sellerId,
        amount,
        currency,
        step: "ADDED_TO_CART",
      });
    },
    [trackPurchaseIntent]
  );

  const trackCheckoutStarted = useCallback(
    (
      productId: string,
      sellerId: string,
      amount: number,
      currency: string = "USD"
    ) => {
      trackPurchaseIntent({
        productId,
        sellerId,
        amount,
        currency,
        step: "CHECKOUT_STARTED",
      });
    },
    [trackPurchaseIntent]
  );

  const trackPaymentAttempted = useCallback(
    (
      productId: string,
      sellerId: string,
      amount: number,
      currency: string = "USD"
    ) => {
      trackPurchaseIntent({
        productId,
        sellerId,
        amount,
        currency,
        step: "PAYMENT_ATTEMPTED",
      });
    },
    [trackPurchaseIntent]
  );

  const trackPurchaseSuccess = useCallback(
    (
      productId: string,
      sellerId: string,
      amount: number,
      currency: string = "USD"
    ) => {
      trackPurchaseIntent({
        productId,
        sellerId,
        amount,
        currency,
        step: "SUCCESS",
      });
    },
    [trackPurchaseIntent]
  );

  const trackPurchaseFailed = useCallback(
    (
      productId: string,
      sellerId: string,
      amount: number,
      failureReason: string,
      currency: string = "USD"
    ) => {
      trackPurchaseIntent({
        productId,
        sellerId,
        amount,
        currency,
        step: "FAILED",
        failureReason,
      });
    },
    [trackPurchaseIntent]
  );

  return {
    trackProductViewed,
    trackAddedToCart,
    trackCheckoutStarted,
    trackPaymentAttempted,
    trackPurchaseSuccess,
    trackPurchaseFailed,
  };
}

export function useCustomOrderTracking() {
  const { trackCustomOrderEvent } = useAnalyticsTracking();

  const trackCustomOrderStarted = useCallback(
    (sellerId: string, formId?: string) => {
      trackCustomOrderEvent({
        sellerId,
        action: "STARTED",
        formId,
      });
    },
    [trackCustomOrderEvent]
  );

  const trackCustomOrderFormCompleted = useCallback(
    (sellerId: string, formId?: string) => {
      trackCustomOrderEvent({
        sellerId,
        action: "FORM_COMPLETED",
        formId,
      });
    },
    [trackCustomOrderEvent]
  );

  const trackCustomOrderPaymentAttempted = useCallback(
    (sellerId: string, amount: number, formId?: string) => {
      trackCustomOrderEvent({
        sellerId,
        action: "PAYMENT_ATTEMPTED",
        formId,
        amount,
      });
    },
    [trackCustomOrderEvent]
  );

  const trackCustomOrderSuccess = useCallback(
    (sellerId: string, amount: number, formId?: string) => {
      trackCustomOrderEvent({
        sellerId,
        action: "SUCCESS",
        formId,
        amount,
      });
    },
    [trackCustomOrderEvent]
  );

  const trackCustomOrderFailed = useCallback(
    (
      sellerId: string,
      amount: number,
      failureReason: string,
      formId?: string
    ) => {
      trackCustomOrderEvent({
        sellerId,
        action: "FAILED",
        formId,
        amount,
        failureReason,
      });
    },
    [trackCustomOrderEvent]
  );

  return {
    trackCustomOrderStarted,
    trackCustomOrderFormCompleted,
    trackCustomOrderPaymentAttempted,
    trackCustomOrderSuccess,
    trackCustomOrderFailed,
  };
}
