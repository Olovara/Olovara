import { useEffect, useRef, useCallback } from 'react';

interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
}

interface MouseTrackingOptions {
  sessionId: string;
  deviceId?: string;
  userId?: string;
  pageUrl: string;
  enabled?: boolean;
  batchSize?: number;
  batchInterval?: number;
}

interface MouseTrackingData {
  movements: MouseMovement[];
  velocity?: number;
  acceleration?: number;
  direction?: string;
  distance?: number;
  pauseTime?: number;
}

export const useMouseTracking = (options: MouseTrackingOptions) => {
  const {
    sessionId,
    deviceId,
    userId,
    pageUrl,
    enabled = true,
    batchSize = 50,
    batchInterval = 5000, // 5 seconds
  } = options;

  const movementsRef = useRef<MouseMovement[]>([]);
  const lastPositionRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTrackingRef = useRef(enabled);

  // Calculate movement metrics
  const calculateMetrics = useCallback((movements: MouseMovement[]): MouseTrackingData => {
    if (movements.length < 2) {
      return { movements };
    }

    const lastMovement = movements[movements.length - 1];
    const prevMovement = movements[movements.length - 2];

    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(lastMovement.x - prevMovement.x, 2) + 
      Math.pow(lastMovement.y - prevMovement.y, 2)
    );

    // Calculate time difference
    const timeDiff = lastMovement.timestamp - prevMovement.timestamp;

    // Calculate velocity (pixels per millisecond)
    const velocity = timeDiff > 0 ? distance / timeDiff : 0;

    // Calculate direction
    const angle = Math.atan2(
      lastMovement.y - prevMovement.y,
      lastMovement.x - prevMovement.x
    );
    const degrees = (angle * 180) / Math.PI;
    const normalized = (degrees + 360) % 360;
    
    let direction = 'E';
    if (normalized >= 22.5 && normalized < 67.5) direction = 'NE';
    else if (normalized >= 67.5 && normalized < 112.5) direction = 'N';
    else if (normalized >= 112.5 && normalized < 157.5) direction = 'NW';
    else if (normalized >= 157.5 && normalized < 202.5) direction = 'W';
    else if (normalized >= 202.5 && normalized < 247.5) direction = 'SW';
    else if (normalized >= 247.5 && normalized < 292.5) direction = 'S';
    else if (normalized >= 292.5 && normalized < 337.5) direction = 'SE';

    // Calculate acceleration if we have 3+ movements
    let acceleration = 0;
    if (movements.length >= 3) {
      const prevPrevMovement = movements[movements.length - 3];
      const prevDistance = Math.sqrt(
        Math.pow(prevMovement.x - prevPrevMovement.x, 2) + 
        Math.pow(prevMovement.y - prevPrevMovement.y, 2)
      );
      const prevTimeDiff = prevMovement.timestamp - prevPrevMovement.timestamp;
      const prevVelocity = prevTimeDiff > 0 ? prevDistance / prevTimeDiff : 0;
      acceleration = timeDiff > 0 ? (velocity - prevVelocity) / timeDiff : 0;
    }

    // Calculate pause time (time since last movement)
    const pauseTime = Date.now() - lastMovement.timestamp;

    return {
      movements,
      velocity,
      acceleration,
      direction,
      distance,
      pauseTime,
    };
  }, []);

  // Send mouse movement data to API
  const sendMouseData = useCallback(async (data: MouseTrackingData) => {
    try {
      const response = await fetch('/api/user-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          eventType: 'MOUSE_MOVEMENT',
          pageUrl,
          deviceId,
          userId,
          interactionData: {
            count: data.movements.length,
            movements: data.movements,
            velocity: data.velocity,
            acceleration: data.acceleration,
            direction: data.direction,
            distance: data.distance,
            pauseTime: data.pauseTime,
          },
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send mouse tracking data:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending mouse tracking data:', error);
    }
  }, [sessionId, pageUrl, deviceId, userId]);

  // Handle mouse movement
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isTrackingRef.current) return;

    const currentTime = Date.now();
    const movement: MouseMovement = {
      x: event.clientX,
      y: event.clientY,
      timestamp: currentTime,
    };

    movementsRef.current.push(movement);

    // Send data when batch size is reached
    if (movementsRef.current.length >= batchSize) {
      const data = calculateMetrics(movementsRef.current);
      sendMouseData(data);
      movementsRef.current = [];
      
      // Clear existing timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
    } else if (!batchTimeoutRef.current) {
      // Set timeout to send data after interval
      batchTimeoutRef.current = setTimeout(() => {
        if (movementsRef.current.length > 0) {
          const data = calculateMetrics(movementsRef.current);
          sendMouseData(data);
          movementsRef.current = [];
        }
        batchTimeoutRef.current = null;
      }, batchInterval);
    }

    lastPositionRef.current = movement;
  }, [batchSize, batchInterval, calculateMetrics, sendMouseData]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (movementsRef.current.length > 0) {
      const data = calculateMetrics(movementsRef.current);
      sendMouseData(data);
      movementsRef.current = [];
    }
  }, [calculateMetrics, sendMouseData]);

  // Start/stop tracking
  const startTracking = useCallback(() => {
    isTrackingRef.current = true;
  }, []);

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false;
    // Send any remaining data
    if (movementsRef.current.length > 0) {
      const data = calculateMetrics(movementsRef.current);
      sendMouseData(data);
      movementsRef.current = [];
    }
  }, [calculateMetrics, sendMouseData]);

  // Setup event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      // Clear timeout and send remaining data
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      if (movementsRef.current.length > 0) {
        const data = calculateMetrics(movementsRef.current);
        sendMouseData(data);
      }
    };
  }, [enabled, handleMouseMove, handleMouseLeave, calculateMetrics, sendMouseData]);

  // Update tracking state when enabled changes
  useEffect(() => {
    isTrackingRef.current = enabled;
  }, [enabled]);

  return {
    startTracking,
    stopTracking,
    isTracking: isTrackingRef.current,
  };
}; 