import {
  getWebsiteBySellerId,
  checkWebsiteBuilderAccess,
  getSellerByUserId,
} from "@/lib/queries";
import React from "react";
import { Crown, Edit, Globe } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreateWebsiteButton from "./CreateWebsiteButton";

const WebsiteBuilder = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  // Get seller information from user session
  const seller = await getSellerByUserId(session.user.id);

  if (!seller) {
    redirect("/seller/dashboard");
  }

  // Check if user has access to website builder
  const accessCheck = await checkWebsiteBuilderAccess(seller.id);

  if (!accessCheck.hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Website Builder</CardTitle>
            <CardDescription>
              {accessCheck.reason === "No subscription found"
                ? "You need a subscription to access the website builder."
                : accessCheck.reason === "Subscription not active"
                  ? "Your subscription is not active. Please update your payment method."
                  : "Website builder is only available in the Studio plan."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to the Studio plan to build your own custom website and
              showcase your products.
            </p>
            <Button asChild>
              <Link href="/seller/dashboard/plans">
                View Subscription Plans
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const website = await getWebsiteBySellerId(seller.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website Builder</h1>
          <p className="text-muted-foreground">
            Create and customize your own website to showcase your products
          </p>
        </div>
      </div>

      {!website ? (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create Your Website</CardTitle>
            <CardDescription className="text-base">
              Build a custom website to showcase your products and grow your
              business beyond the marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Your website will include:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Custom domain support</li>
              <li>• Product showcase sections</li>
              <li>• Contact forms</li>
              <li>• SEO optimization</li>
              <li>• Mobile-responsive design</li>
            </ul>
            <CreateWebsiteButton sellerId={seller.id} />
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{website.name}</CardTitle>
                <CardDescription>
                  {website.description || "Your custom website"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {website.published ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    Draft
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Pages:</span>{" "}
                {website.pages?.length || 0}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                {website.published ? "Live" : "Draft"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link
                  href={`/seller/dashboard/website-builder/${website.id}/editor/${website.pages?.[0]?.id || ""}`}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Website
                </Link>
              </Button>
              {website.published && (
                <Button variant="outline" asChild>
                  <Link
                    href={`/website/${website.websiteSlug || website.id}`}
                    target="_blank"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    View Live
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebsiteBuilder;
