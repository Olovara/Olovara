"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  action: string;
  trigger?: boolean; // New prop to control when to execute
}

export const ReCaptcha = ({ onVerify, onError, action, trigger = false }: ReCaptchaProps) => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isReady = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeReCaptcha = useCallback(async () => {
    if (!isReady.current || !trigger) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = await window.grecaptcha.execute(siteKey!, {
        action,
      });
      onVerify(token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "reCAPTCHA verification failed";
      console.error("reCAPTCHA error:", error);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [siteKey, action, onVerify, onError, trigger]);

  // In development mode, automatically trigger success after a short delay
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && trigger) {
      const timer = setTimeout(() => {
        onVerify('dev-token');
      }, 500); // Small delay to simulate reCAPTCHA execution
      
      return () => clearTimeout(timer);
    }
  }, [trigger, onVerify]);

  useEffect(() => {
    if (trigger && isReady.current) {
      executeReCaptcha();
    }
  }, [trigger, executeReCaptcha]);

  // Show development message instead of reCAPTCHA in development mode
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          🔧 <strong>Development Mode:</strong> reCAPTCHA simulation active.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
        onLoad={() => {
          window.grecaptcha.ready(() => {
            isReady.current = true;
            // Don't execute immediately - wait for trigger
          });
        }}
      />
      {isLoading && (
        <div className="text-sm text-gray-600">
          🔒 Verifying security...
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}
    </>
  );
}; 