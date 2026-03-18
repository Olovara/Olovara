import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SuccessRoute() {
  return (
    <section className="w-full min-h-[80vh] flex items-center justify-center bg-brand-light-neutral-25">
      <Card className="w-[350px] bg-brand-light-neutral-50">
        <div className="p-6">
          <div className="w-full flex justify-center">
            <CheckCircle className="w-12 h-12 rounded-full bg-brand-success-50 text-brand-success-600 p-2" />
          </div>
          <div className="mt-3 text-center sm:mt-5 w-full">
            <h3 className="text-lg leading-6 font-semibold text-brand-dark-neutral-900">
              Payment Successful
            </h3>
            <p className="mt-2 text-sm text-brand-dark-neutral-600">
              Congrats to your purchase! Please check your email for further
              instructions.
            </p>

            <Button className="mt-5 sm:mt-6 w-full" asChild>
              <Link href="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}