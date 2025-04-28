"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "@/src/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  text: string;
  sender: string;
  receiver: string;
  createdAt: Date;
}

interface OnlineUser {
  username: string;
  socketId: string;
}

interface MessagesDashboardProps {
  session: {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      role: string | null;
    };
    expires: string;
  } | null;
  userType: "seller" | "member";
}

export default function MessagesDashboard({ session, userType }: MessagesDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Debug session data
  console.log("Full session data:", session);
  console.log("User data:", session?.user);
  console.log("User name:", session?.user?.name);
  
  // Use email as username if name is not available
  const currentUser = session?.user?.name || session?.user?.email || "";
  console.log("Current user (using email as fallback):", currentUser);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch existing messages when selectedUser changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !currentUser) return;
      
      try {
        const response = await fetch(`/api/messages?user=${selectedUser}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedUser, currentUser]);

  useEffect(() => {
    console.log("Current user:", currentUser);
    console.log("Socket connected:", socket.connected);

    if (currentUser) {
      console.log("Emitting newUser event with:", currentUser);
      socket.emit("newUser", currentUser);
    } else {
      console.log("No current user, cannot emit newUser event");
    }

    socket.on("connect", () => {
      console.log("Socket connected!");
      if (currentUser) {
        console.log("Re-emitting newUser after connect");
        socket.emit("newUser", currentUser);
      }
    });

    socket.on("getMessage", (message: Message) => {
      console.log("Received message:", message);
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        // Only add if it's relevant to the current conversation
        if (message.sender === selectedUser || message.receiver === selectedUser) {
          return [...prev, message];
        }
        return prev;
      });
    });

    socket.on("getOnlineUsers", (users: OnlineUser[]) => {
      console.log("Received online users:", users);
      // Filter out the current user and update the list
      const otherUsers = users.filter(user => user.username !== currentUser);
      console.log("Filtered online users:", otherUsers);
      setOnlineUsers(otherUsers);
    });

    return () => {
      socket.off("connect");
      socket.off("getMessage");
      socket.off("getOnlineUsers");
    };
  }, [currentUser, selectedUser]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedUser || !session?.user?.id) return;

    console.log("Sending message:", {
      senderId: session.user.id,
      recipientId: selectedUser,
      text: newMessage,
    });

    socket.emit("sendMessage", {
      senderId: session.user.id,
      recipientId: selectedUser,
      text: newMessage,
    });

    setNewMessage("");
  };

  return (
    <div className="flex h-[600px] border rounded-lg">
      {/* Online Users List */}
      <div className="w-1/4 border-r p-4">
        <h2 className="font-bold mb-4">Online Users</h2>
        <div className="space-y-2">
          {onlineUsers.length === 0 ? (
            <div className="text-gray-500">No users online</div>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.socketId}
                className={`p-2 rounded cursor-pointer ${
                  selectedUser === user.username ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedUser(user.username)}
              >
                {user.username}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          {messages
            .filter(
              (msg) =>
                (msg.sender === selectedUser && msg.receiver === currentUser) ||
                (msg.sender === currentUser && msg.receiver === selectedUser)
            )
            .map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.sender === currentUser ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-2 rounded-lg ${
                    message.sender === currentUser
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {message.text}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              disabled={!selectedUser}
            />
            <Button onClick={sendMessage} disabled={!selectedUser}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 