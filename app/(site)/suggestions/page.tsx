import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SuggestionCard } from "./_components/suggestion-card";
import { CreateSuggestionButton } from "./_components/create-suggestion-button";
import { SuggestionFilters } from "./_components/suggestion-filters";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";
import { Metadata } from "next";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const types = searchParams.types?.split(",") || [];
  const sortBy = searchParams.sort || "upvotes-desc";
  
  // Build canonical URL
  const canonicalParams = new URLSearchParams();
  if (types.length > 0) canonicalParams.set("types", types.join(","));
  if (sortBy !== "upvotes-desc") canonicalParams.set("sort", sortBy);
  
  const canonicalUrl = canonicalParams.toString() 
    ? `/suggestions?${canonicalParams.toString()}`
    : "/suggestions";

  // Generate dynamic title and description based on filters
  let title = "Feature Suggestions & Feedback | OLOVARA - Help Shape Our Marketplace";
  let description = "Share your ideas and feedback to help improve OLOVARA. Submit feature requests, bug reports, and suggestions to make our handmade marketplace better for artisans and customers.";
  
  if (types.length > 0) {
    const typeLabels = types.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(", ");
    title = `${typeLabels} Suggestions | OLOVARA - Help Improve Our Marketplace`;
    description = `Browse ${typeLabels.toLowerCase()} suggestions and feedback for OLOVARA. Help us improve our handmade marketplace by reviewing and upvoting ideas from our community.`;
  }

  return {
    title,
    description,
    keywords: [
      "feature suggestions",
      "marketplace feedback",
      "user feedback",
      "feature requests",
      "bug reports",
      "improvement suggestions",
      "handmade marketplace feedback",
      ...types.map(type => `${type} suggestions`)
    ],
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

interface PageProps {
  searchParams: {
    types?: string;
    sort?: string;
  };
}

export default async function Suggestions({ searchParams }: PageProps) {
  const session = await auth();
  
  // Parse filter and sort parameters
  const types = searchParams.types?.split(",") || [];
  const sortBy = searchParams.sort || "upvotes-desc";

  // Build the where clause for filtering
  const where = types.length > 0 ? {
    type: {
      in: types,
    },
  } : {};

  // Build the orderBy clause for sorting
  const orderBy = (() => {
    switch (sortBy) {
      case "upvotes-asc":
        return { upvoteCount: "asc" as const };
      case "newest":
        return { createdAt: "desc" as const };
      case "oldest":
        return { createdAt: "asc" as const };
      case "upvotes-desc":
      default:
        return { upvoteCount: "desc" as const };
    }
  })();

  const suggestions = await db.suggestion.findMany({
    where,
    orderBy,
    include: {
      user: true,
      upvotes: true,
    },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Hidden on mobile, shown on desktop */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-8">
            <SuggestionFilters />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Feature Suggestions</h1>
              <p className="text-muted-foreground mt-1">
                Help shape OLOVARA by sharing your ideas
              </p>
            </div>
            {session?.user && <CreateSuggestionButton />}
          </div>
          
          {suggestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4">Be the First to Share Your Ideas!</h2>
                <p className="text-gray-600 mb-6">
                  Help us build a better marketplace for artisans and customers. Your feedback and suggestions are invaluable in shaping the future of OLOVARA.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Feature Requests</h3>
                    <p>Suggest new features that would help you sell or buy handmade goods</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Improvement Ideas</h3>
                    <p>Share ways we can enhance the existing marketplace experience</p>
                  </div>
                </div>
                {session?.user && (
                  <div className="mt-6">
                    <CreateSuggestionButton />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suggestions.map((suggestion) => (
                <SuggestionCard 
                  key={suggestion.id} 
                  suggestion={suggestion}
                  currentUserId={session?.user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Add structured data for SEO */}
      <WebsiteStructuredData pageType="suggestions" />
    </div>
  );
}
