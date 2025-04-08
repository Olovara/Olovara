"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutCancelPage() {
  return (
    <div className="container max-w-3xl py-10">
      <Card className="mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Checkout Cancelled</CardTitle>
          <CardDescription>
            Your checkout process was cancelled.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            No charges were made to your account.
          </p>
          <p className="text-sm text-muted-foreground">
            If you encountered any issues, please contact our support team.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button asChild variant="outline">
            <Link href="/">Continue Shopping</Link>
          </Button>
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 