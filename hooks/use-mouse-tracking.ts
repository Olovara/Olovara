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
    batchSize = 500, // Increased from 200 to 500
    batchInterval = 60000, // Increased from 30000 to 60000 (60 seconds)
  } = options;

  const movementsRef = useRef<MouseMovement[]>([]);
  const lastPositionRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTrackingRef = useRef(enabled);
  const lastSendTimeRef = useRef<number>(0);
  const throttleInterval = 200; // Increased from 100ms to 200ms

  // Calculate metrics from movements
  const calculateMetrics = useCallback((movements: MouseMovement[]) => {
    if (movements.length < 2) {
      return {
        movements: movements.slice(-5),
        velocity: 0,
        acceleration: 0,
        direction: 'STRAIGHT',
        distance: 0,
        pauseTime: 0,
      };
    }

    let totalDistance = 0;
    let totalVelocity = 0;
    let totalAcceleration = 0;
    let totalPauseTime = 0;
    let directionChanges = 0;

    for (let i = 1; i < movements.length; i++) {
      const prev = movements[i - 1];
      const curr = movements[i];
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      totalDistance += distance;
      
      const timeDiff = curr.timestamp - prev.timestamp;
      if (timeDiff > 0) {
        const velocity = distance / timeDiff;
        totalVelocity += velocity;
        
        // Calculate acceleration if we have 3 points
        if (i > 1) {
          const prevVelocity = Math.sqrt(
            Math.pow(prev.x - movements[i - 2].x, 2) + 
            Math.pow(prev.y - movements[i - 2].y, 2)
          ) / (prev.timestamp - movements[i - 2].timestamp);
          
          if (timeDiff > 0) {
            const acceleration = (velocity - prevVelocity) / timeDiff;
            totalAcceleration += acceleration;
          }
        }
        
        // Calculate pause time (gaps > 100ms)
        if (timeDiff > 100) {
          totalPauseTime += timeDiff - 100;
        }
      }
      
      // Calculate direction changes
      if (i > 1) {
        const prevDirection = Math.atan2(prev.y - movements[i - 2].y, prev.x - movements[i - 2].x);
        const currDirection = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        const directionDiff = Math.abs(currDirection - prevDirection);
        if (directionDiff > Math.PI / 4) { // 45 degrees
          directionChanges++;
        }
      }
    }

    const avgVelocity = totalVelocity / (movements.length - 1);
    const avgAcceleration = totalAcceleration / Math.max(1, movements.length - 2);
    const directionChangesCount = directionChanges / Math.max(1, movements.length - 2);

    return {
      movements: movements.slice(-5), // Only keep last 5 movements
      velocity: avgVelocity,
      acceleration: avgAcceleration,
      direction: directionChangesCount > 0 ? 'CHANGING' : 'STRAIGHT',
      distance: totalDistance,
      pauseTime: totalPauseTime,
    };
  }, []);

  // Send mouse movement data to API
  const sendMouseData = useCallback(async (data: MouseTrackingData) => {
    // Prevent sending too frequently
    const now = Date.now();
    if (now - lastSendTimeRef.current < 10000) { // Increased from 5000 to 10000 (10 seconds)
      return;
    }
    lastSendTimeRef.current = now;

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
            movements: data.movements.slice(-5), // Reduced from 10 to 5
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

  // Handle mouse movement with throttling and distance filtering
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isTrackingRef.current) return;

    const currentTime = Date.now();
    
    // Throttle mouse events
    if (currentTime - lastSendTimeRef.current < throttleInterval) {
      return;
    }

    // Check if movement is significant enough to track (minimum 10 pixels)
    if (lastPositionRef.current) {
      const distance = Math.sqrt(
        Math.pow(event.clientX - lastPositionRef.current.x, 2) + 
        Math.pow(event.clientY - lastPositionRef.current.y, 2)
      );
      
      if (distance < 10) { // Increased from 5 to 10 pixels
        return;
      }
    }

    const movement: MouseMovement = {
      x: event.clientX,
      y: event.clientY,
      timestamp: currentTime,
    };

    movementsRef.current.push(movement);

    // Limit the number of movements stored in memory
    if (movementsRef.current.length > 200) { // Reduced from 500 to 200
      movementsRef.current = movementsRef.current.slice(-100); // Reduced from 200 to 100
    }

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
  }, [batchSize, batchInterval, calculateMetrics, sendMouseData, throttleInterval]);

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