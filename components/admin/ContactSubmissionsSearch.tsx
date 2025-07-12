"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";

export function ContactSubmissionsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [reason, setReason] = useState(searchParams.get("reason") || "all");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (reason && reason !== "all") params.set("reason", reason);
    
    router.push(`/admin/dashboard/contact-submissions?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (value && value !== "all") params.set("reason", value);
    
    router.push(`/admin/dashboard/contact-submissions?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Select value={reason} onValueChange={handleReasonChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Reasons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="BILLING">Billing</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="LISTING">Listing Issue</SelectItem>
            <SelectItem value="ACCOUNT">Account Support</SelectItem>
            <SelectItem value="PAYMENT">Payment Problem</SelectItem>
            <SelectItem value="FEATURE">Feature Request</SelectItem>
            <SelectItem value="BUG">Bug Report</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 