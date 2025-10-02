import { getWebsitePageDetails, getSellerByUserId } from "@/lib/queries";
import EditorProvider from "@/providers/editor/editor-provider";
import { redirect } from "next/navigation";
import React from "react";
import WebsiteEditorNavigation from "./_components/website-editor-navigation";
import WebsiteEditorSidebar from "./_components/website-editor-sidebar";
import WebsiteEditor from "./_components/website-editor";
import { auth } from "@/auth";

type Props = {
  params: {
    websiteId: string;
    websitePageId: string;
  };
};

const Page = async ({ params }: Props) => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  // Get seller information from user session
  const seller = await getSellerByUserId(session.user.id);

  if (!seller) {
    redirect("/seller/dashboard");
  }

  const websitePageDetails = await getWebsitePageDetails(params.websitePageId);

  if (!websitePageDetails) {
    return redirect("/seller/dashboard/website-builder");
  }

  // Verify the website belongs to the seller
  if (websitePageDetails.website.sellerId !== seller.id) {
    return redirect("/seller/dashboard/website-builder");
  }

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 z-[20] bg-background overflow-hidden">
      <EditorProvider
        sellerId={seller.id}
        websiteId={params.websiteId}
        pageDetails={websitePageDetails}
      >
        <WebsiteEditorNavigation
          websiteId={params.websiteId}
          websitePageDetails={websitePageDetails}
          sellerId={seller.id}
        />
        <div className="h-full flex justify-center">
          <WebsiteEditor websitePageId={params.websitePageId} />
        </div>

        <WebsiteEditorSidebar sellerId={seller.id} />
      </EditorProvider>
    </div>
  );
};

export default Page;
