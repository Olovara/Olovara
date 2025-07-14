"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertTriangle } from "lucide-react";

interface AuthRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "high_value" | "digital_item";
  orderValue?: number;
}

export default function AuthRequirementModal({
  isOpen,
  onClose,
  reason,
  orderValue,
}: AuthRequirementModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    setIsLoading(true);
    const currentPath = window.location.pathname;
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
    router.push(loginUrl);
  };

  const handleRegister = () => {
    setIsLoading(true);
    const currentPath = window.location.pathname;
    const registerUrl = `/register?callbackUrl=${encodeURIComponent(currentPath)}`;
    router.push(registerUrl);
  };

  const getTitle = () => {
    if (reason === "high_value") {
      return "Authentication Required";
    }
    return "Account Required for Digital Items";
  };

  const getDescription = () => {
    if (reason === "high_value") {
      return `Orders over $${orderValue?.toFixed(2) || "100"} require a signed-in account for fraud prevention and order tracking.`;
    }
    return "Digital items require a signed-in account for secure delivery and fraud prevention.";
  };

  const getIcon = () => {
    if (reason === "high_value") {
      return <Shield className="h-6 w-6 text-amber-500" />;
    }
    return <Lock className="h-6 w-6 text-blue-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <DialogTitle className="text-xl font-semibold">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">
                  Why is this required?
                </p>
                <ul className="text-muted-foreground space-y-1">
                  {reason === "high_value" ? (
                    <>
                      <li>• Fraud prevention for high-value transactions</li>
                      <li>• Better order tracking and customer support</li>
                      <li>• Secure payment processing</li>
                    </>
                  ) : (
                    <>
                      <li>• Secure digital product delivery</li>
                      <li>• Purchase history and re-download access</li>
                      <li>• Fraud prevention for digital items</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Continue Shopping
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleRegister}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Create Account
            </Button>
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? "Redirecting..." : "Sign In"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 