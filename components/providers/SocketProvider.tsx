"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO } from "socket.io-client";
import { useSession } from "next-auth/react";

type SocketContextType = {
  socket: any | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    console.log("SocketProvider: Session state:", { hasSession: !!session, userId: session?.user?.id });
    
    if (!session?.user?.id) {
      console.log("SocketProvider: No session or user ID, skipping socket setup");
      return;
    }

    console.log("SocketProvider: Creating socket connection...");

    // Use the same socket URL configuration as the working messaging system
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}`
        : 'ws://localhost:3001');

    const socketInstance = new (ClientIO as any)(socketUrl, {
      query: {
        userId: session.user.id
      },
      // Add secure connection options
      secure: process.env.NODE_ENV === 'production',
      rejectUnauthorized: false,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    socketInstance.on("connect", () => {
      console.log("SocketProvider: Socket connected successfully");
      setIsConnected(true);
      // Send user ID for session update targeting
      socketInstance.emit("newUser", session.user.id);
      console.log("SocketProvider: Sent newUser event with ID:", session.user.id);
    });

    socketInstance.on("disconnect", () => {
      console.log("SocketProvider: Socket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error: any) => {
      console.error("SocketProvider: Connection error:", error);
    });

    setSocket(socketInstance);

    return () => {
      console.log("SocketProvider: Cleaning up socket connection");
      socketInstance.disconnect();
    };
  }, [session]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}; 