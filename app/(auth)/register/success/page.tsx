import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterSuccessPage() {
  return (
    <div className="flex w-full min-w-0 flex-col items-center justify-center py-12">
      <Card className="w-full min-w-0 max-w-md border border-brand-primary-200 bg-gradient-to-br from-brand-primary-50 to-brand-light-neutral-50 text-brand-dark-neutral-900 shadow-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-brand-success-600" />
          </div>
          <CardTitle className="text-2xl text-brand-dark-neutral-900">
            Registration Successful!
          </CardTitle>
          <CardDescription className="text-brand-dark-neutral-600">
            Your account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-brand-dark-neutral-600">
            Thank you for registering with our platform. You can now log in to your account and start exploring.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
