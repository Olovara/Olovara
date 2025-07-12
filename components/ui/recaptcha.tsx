"use client";

import { useEffect, useRef, useCallback } from "react";
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
  action: string;
}

export const ReCaptcha = ({ onVerify, action }: ReCaptchaProps) => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isReady = useRef(false);

  const executeReCaptcha = useCallback(async () => {
    try {
      const token = await window.grecaptcha.execute(siteKey!, {
        action,
      });
      onVerify(token);
    } catch (error) {
      console.error("reCAPTCHA error:", error);
    }
  }, [siteKey, action, onVerify]);

  useEffect(() => {
    if (isReady.current) {
      executeReCaptcha();
    }
  }, [executeReCaptcha]);

  // Show development message instead of reCAPTCHA in development mode
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          🔧 <strong>Development Mode:</strong> reCAPTCHA is disabled for local development.
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
            executeReCaptcha();
          });
        }}
      />
    </>
  );
}; 