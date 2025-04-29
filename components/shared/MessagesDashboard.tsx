"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  content: string;
  sender: string;
  senderId: string;
  createdAt: Date;
  conversationId?: string;
}

interface Conversation {
  id: string;
  lastMessage: string;
  lastMessageTime: Date;
  otherUser: {
    id: string;
    email: string;
    name: string;
  };
}

interface MessagesDashboardProps {
  userType: "seller" | "member";
  session?: {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      role: string | null;
    };
    expires: string;
  } | null;
}

export default function MessagesDashboard({ userType, session: serverSession }: MessagesDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const { data: clientSession, status } = useSession();

  // Use server session if available, otherwise use client session
  const session = serverSession || clientSession;

  // Initialize WebSocket connection
  useEffect(() => {
    if (!session?.user?.id) return;

    // Get the socket URL from environment variable
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}`
        : 'ws://localhost:3001');

    // Initialize socket connection
    socketRef.current = io(socketUrl, {
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

    // Register user with socket server
    socketRef.current.emit("newUser", session.user.id);

    // Listen for new messages
    socketRef.current.on("newMessage", (message: Message) => {
      // Check if we already have this message (from optimistic update)
      setMessages(prev => {
        const isDuplicate = prev.some(m => 
          m.content === message.content && 
          m.senderId === message.senderId && 
          Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 1000
        );
        
        if (isDuplicate) {
          // Replace the optimistic message with the real one
          return prev.map(m => 
            m.content === message.content && 
            m.senderId === message.senderId && 
            Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 1000
              ? message
              : m
          );
        }
        
        return [...prev, message];
      });
      
      // Update conversation list if the message is from the current conversation
      if (message.conversationId === selectedConversation) {
        setConversations(prev => prev.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message.content,
              lastMessageTime: message.createdAt
            };
          }
          return conv;
        }));
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [session?.user?.id, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch("/api/messages/conversations");
        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [session?.user?.id]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation || !session?.user?.id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/messages?conversation=${selectedConversation}`);
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, session?.user?.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !session?.user?.id) return;

    try {
      // Emit the new message through WebSocket
      if (socketRef.current) {
        socketRef.current.emit("sendMessage", {
          content: newMessage,
          conversationId: selectedConversation,
          senderId: session.user.id
        });
        
        // Clear the input field
        setNewMessage("");
      } else {
        throw new Error("WebSocket connection not available");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!session?.user?.id) {
    return <div className="flex items-center justify-center h-full">Please sign in to view messages</div>;
  }

  return (
    <div className="flex h-full">
      {/* Conversations List */}
      <div className="w-1/3 border-r p-4">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        {conversations.length === 0 ? (
          <p className="text-gray-500">No conversations yet</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer ${
                  selectedConversation === conversation.id
                    ? "bg-blue-100"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="font-medium">{conversation.otherUser.name}</div>
                <div className="text-sm text-gray-500">
                  {conversation.lastMessage}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${
                    message.senderId === session.user.id
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      message.senderId === session.user.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
} 