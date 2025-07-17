"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";

interface SellPageClientProps {
  children: React.ReactNode;
}

export default function SellPageClient({ children }: SellPageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [wantsToBecomeSeller, setWantsToBecomeSeller] = useState(false);

  // Check if user wants to become a seller (from localStorage or URL param)
  useEffect(() => {
    const stored = localStorage.getItem("wantsToBecomeSeller");
    const urlParam = new URLSearchParams(window.location.search).get("startApplication");
    
    if (stored === "true" || urlParam === "true") {
      setWantsToBecomeSeller(true);
      localStorage.setItem("wantsToBecomeSeller", "true");
    }
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      // User is logged in
      if (wantsToBecomeSeller) {
        // Clear the flag and redirect to seller application
        localStorage.removeItem("wantsToBecomeSeller");
        router.push("/seller-application");
      }
    } else {
      // User is not logged in
      if (wantsToBecomeSeller) {
        // Show auth modal if they want to become a seller
        setShowAuthModal(true);
      }
    }
  }, [session, status, wantsToBecomeSeller, router]);

  const handleApplyClick = useCallback(() => {
    if (session?.user) {
      // User is logged in, go directly to application
      router.push("/seller-application");
    } else {
      // User is not logged in, set flag and show auth modal
      localStorage.setItem("wantsToBecomeSeller", "true");
      setWantsToBecomeSeller(true);
      setShowAuthModal(true);
    }
  }, [session?.user, router, setWantsToBecomeSeller, setShowAuthModal]);

  const handleAuthSuccess = () => {
    // Auth was successful, the useEffect above will handle the redirect
    setWantsToBecomeSeller(true);
  };

  // Add click handlers to Apply buttons
  useEffect(() => {
    const applyButtons = document.querySelectorAll('.apply-button');
    applyButtons.forEach(button => {
      button.addEventListener('click', handleApplyClick);
    });

    // Cleanup
    return () => {
      applyButtons.forEach(button => {
        button.removeEventListener('click', handleApplyClick);
      });
    };
  }, [handleApplyClick]);

  return (
    <>
      {children}
      
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        initialTab="register"
        onAuthSuccess={handleAuthSuccess}
        redirectTo="/sell?startApplication=true"
      />
    </>
  );
} 