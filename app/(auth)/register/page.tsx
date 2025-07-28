import RegisterForm from "@/components/auth/register-form";
import { Suspense } from "react";
import { Metadata } from "next";

interface RegisterPageProps {
  searchParams: {
    callbackUrl?: string;
  };
}

export async function generateMetadata({ searchParams }: RegisterPageProps): Promise<Metadata> {
  const callbackUrl = searchParams.callbackUrl;
  
  // Build canonical URL
  const canonicalUrl = callbackUrl 
    ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/register";

  return {
    title: "Create Account | Yarnnu - Join Our Handmade Marketplace",
    description: "Join Yarnnu and discover unique handmade products from talented artisans worldwide. Create your account to start shopping, selling, or supporting independent creators.",
    keywords: [
      "create account",
      "sign up",
      "join marketplace",
      "handmade marketplace",
      "artisan platform",
      "register account"
    ],
    openGraph: {
      title: "Create Account | Yarnnu - Join Our Handmade Marketplace",
      description: "Join Yarnnu and discover unique handmade products from talented artisans worldwide.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Create Account | Yarnnu - Join Our Handmade Marketplace",
      description: "Join Yarnnu and discover unique handmade products from talented artisans worldwide.",
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center"></div>
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterForm redirectTo={searchParams.callbackUrl} />
      </Suspense>
    </div>
  );
}
