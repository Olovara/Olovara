"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { User, ArrowRight, Sparkles } from "lucide-react";
import { saveFirstName } from "@/actions/onboardingActions";
import { toast } from "sonner";

interface FirstNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirstNameModal({ isOpen, onClose }: FirstNameModalProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      toast.error("Please enter your first name");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await saveFirstName({
        firstName: firstName.trim(),
      });

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      // Close modal immediately for better UX
      onClose();
      
      // Show success toast
      toast.success("Welcome to OLOVARA!");
      
      // Redirect to welcome page (use replace to avoid adding to history)
      router.replace("/onboarding/welcome");
    } catch (error) {
      console.error("Error saving first name:", error);
      toast.error("Failed to save your name");
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Close modal first
    onClose();
    // Redirect to welcome page without saving first name
    router.replace("/onboarding/welcome");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center mb-4"
          >
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🎉 Welcome to OLOVARA!
          </DialogTitle>
          
          <DialogDescription className="text-lg text-gray-600 mt-2">
            Let&apos;s personalize your experience.
          </DialogDescription>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              What&apos;s your first name?
            </Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name..."
              className="text-lg p-4"
              maxLength={50}
              autoFocus
            />
            <p className="text-sm text-gray-500">
              We&apos;ll use this to personalize your onboarding experience
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !firstName.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-full"
            >
              {isSubmitting ? (
                "Setting up..."
              ) : (
                <>
                  Continue to Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-800"
            >
              Skip for now
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
