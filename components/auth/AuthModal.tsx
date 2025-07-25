"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail } from "lucide-react";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "login" | "register";
  onAuthSuccess?: () => void;
  redirectTo?: string;
}

export default function AuthModal({ 
  open, 
  onOpenChange, 
  initialTab = "register",
  onAuthSuccess,
  redirectTo
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleAuthSuccess = () => {
    if (activeTab === "register") {
      // For registration, show success state first
      setShowSuccess(true);
      // Close modal after 5 seconds to give user time to read
      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onAuthSuccess?.();
          onOpenChange(false);
          setShowSuccess(false);
          setIsClosing(false);
        }, 300); // Animation duration
      }, 5000);
    } else {
      // For login, close immediately
      onAuthSuccess?.();
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (showSuccess) {
      // If showing success, close immediately
      setIsClosing(true);
      setTimeout(() => {
        onOpenChange(false);
        setShowSuccess(false);
        setIsClosing(false);
      }, 300);
    } else {
      onOpenChange(false);
    }
  };

  // Show success state for registration
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={`sm:max-w-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Account Created Successfully!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Check Your Email
              </h3>
              <p className="text-gray-600 text-sm">
                We&apos;ve sent you a verification email. Please check your inbox (and spam folder) and click the verification link to complete your registration.
              </p>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Next Steps:</strong> After verifying your email, you&apos;ll be automatically redirected to start your seller application.
              </p>
            </div>
            
            <Button 
              onClick={handleClose}
              variant="outline"
              className="w-full"
            >
              Got it, thanks!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {activeTab === "login" ? "Welcome Back" : "Join Yarnnu"}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Create Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <LoginForm onSuccess={handleAuthSuccess} />
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <RegisterForm onSuccess={handleAuthSuccess} redirectTo={redirectTo} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 