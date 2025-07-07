"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "not-found">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email) {
      setStatus("error");
      setMessage("No email address provided");
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to unsubscribe");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    unsubscribe();
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Newsletter Unsubscribe
            </CardTitle>
            <CardDescription>
              {email && `Unsubscribing ${email} from our newsletter`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Processing your request...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Successfully Unsubscribed</p>
                  <p className="text-gray-600">{message}</p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="h-12 w-12 text-red-600" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Error</p>
                  <p className="text-gray-600">{message}</p>
                </div>
              </div>
            )}

            <div className="pt-4">
              <Link href="/">
                <Button className="w-full">
                  Return to Homepage
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-500">
              If you change your mind, you can always{" "}
              <Link href="/" className="text-blue-600 hover:underline">
                resubscribe
              </Link>{" "}
              from our homepage.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 