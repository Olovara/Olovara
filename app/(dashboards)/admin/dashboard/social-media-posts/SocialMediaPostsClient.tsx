"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

export function SocialMediaPostsClient({
  initialSearch,
  initialStatus,
  initialPage,
}: {
  initialSearch: string;
  initialStatus: string;
  initialPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status && status !== "ACTIVE") params.set("status", status);
      params.set("page", "1"); // Reset to first page on search
      router.push(`?${params.toString()}`);
    });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (newStatus && newStatus !== "ACTIVE") params.set("status", newStatus);
      params.set("page", "1"); // Reset to first page on filter change
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Search products by name, description, or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="w-full"
        />
      </div>
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="HIDDEN">Hidden</SelectItem>
          <SelectItem value="DISABLED">Disabled</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleSearch} disabled={isPending}>
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  );
}

