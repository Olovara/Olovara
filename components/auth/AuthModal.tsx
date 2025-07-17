"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
    onOpenChange(false);
  };

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