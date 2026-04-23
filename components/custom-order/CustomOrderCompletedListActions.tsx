"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis } from "lucide-react";

/** Links to custom-order dashboards (no product OrderDetailsModal). */
export default function CustomOrderCompletedListActions({
  role,
}: {
  role: "seller" | "buyer";
}) {
  const href =
    role === "seller"
      ? "/seller/dashboard/custom-orders/submissions"
      : "/member/dashboard/custom-orders";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <Ellipsis className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={href}>View custom orders</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
