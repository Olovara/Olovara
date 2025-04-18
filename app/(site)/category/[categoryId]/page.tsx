import { Filters } from "@/components/filters";
import { SearchParams } from "@/types";

export default async function CategoryPage({ 
  params,
  searchParams 
}: { 
  params: { categoryId: string },
  searchParams: SearchParams 
}) {
  return (
    <div className="container mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4">Category Products</h1>
      <Filters />
      {/* ... rest of the page ... */}
    </div>
  );
} 