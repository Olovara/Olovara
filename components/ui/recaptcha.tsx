"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (isReady.current) {
      executeReCaptcha();
    }
  }, [isReady.current]);

  const executeReCaptcha = async () => {
    try {
      const token = await window.grecaptcha.execute(siteKey!, {
        action,
      });
      onVerify(token);
    } catch (error) {
      console.error("reCAPTCHA error:", error);
    }
  };

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