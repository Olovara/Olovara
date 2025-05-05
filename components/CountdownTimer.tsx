"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  dropDate: Date | null;
  dropTime: string | null;
  className?: string;
  variant?: "default" | "compact";
}

export function CountdownTimer({ 
  dropDate, 
  dropTime, 
  className,
  variant = "default" 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!dropDate || !dropTime) return;

    // Combine date and time into a single timestamp
    const [hours, minutes] = dropTime.split(":").map(Number);
    const dropDateTime = new Date(dropDate);
    dropDateTime.setHours(hours, minutes, 0, 0);

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = dropDateTime.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [dropDate, dropTime]);

  if (!dropDate || !dropTime || isExpired) return null;

  if (!timeLeft) return null;

  if (variant === "compact") {
    return (
      <div className={cn("text-sm font-medium text-gray-900", className)}>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours > 0 && `${timeLeft.hours}h `}
        {timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
        {timeLeft.seconds}s
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium text-gray-900">Drops in:</h3>
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{timeLeft.days}</span>
            <span className="text-xs text-gray-500">days</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{timeLeft.hours}</span>
          <span className="text-xs text-gray-500">hours</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{timeLeft.minutes}</span>
          <span className="text-xs text-gray-500">minutes</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{timeLeft.seconds}</span>
          <span className="text-xs text-gray-500">seconds</span>
        </div>
      </div>
    </div>
  );
} 