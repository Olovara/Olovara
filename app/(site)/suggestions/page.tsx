import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SuggestionCard } from "./_components/suggestion-card";
import { CreateSuggestionButton } from "./_components/create-suggestion-button";
import { SuggestionFilters } from "./_components/suggestion-filters";

export const metadata = {
  title: "Yarnnu - Suggestions",
};

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
                Help shape Yarnnu by sharing your ideas
              </p>
            </div>
            {session?.user && <CreateSuggestionButton />}
          </div>
          
          {suggestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No suggestions found matching your filters.</p>
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
    </div>
  );
}
