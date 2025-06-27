"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export const SessionUpdateListener = () => {
  const { data: session, update } = useSession();
  const { socket } = useSocket();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    if (!socket) {
      console.log("SessionUpdateListener: No socket available");
      return;
    }

    console.log("SessionUpdateListener: Setting up session update listener");

    const handleSessionUpdate = async (data: {
      message: string;
      updatedBy: string;
      reason: string;
      timestamp: string;
    }) => {
      console.log("SessionUpdateListener: Received session update:", data);
      
      try {
        // Show notification to user
        setNotificationMessage(data.message);
        setShowNotification(true);

        // Force session refresh
        await update();
        
        console.log("SessionUpdateListener: Session updated successfully");
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
      } catch (error) {
        console.error("SessionUpdateListener: Error updating session:", error);
        setNotificationMessage("Failed to update session. Please refresh the page.");
        setShowNotification(true);
      }
    };

    socket.on("sessionUpdated", handleSessionUpdate);

    return () => {
      console.log("SessionUpdateListener: Cleaning up session update listener");
      socket.off("sessionUpdated", handleSessionUpdate);
    };
  }, [socket, update]);

  // Show notification if needed
  useEffect(() => {
    if (showNotification) {
      toast.info(notificationMessage, {
        duration: 5000,
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
    }
  }, [showNotification, notificationMessage]);

  return null;
}; 