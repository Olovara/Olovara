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
      <Filters 
        initialCategory={params.categoryId}
        showCategoryFilter={false} // Hide category filter since we're on a category page
      />
      {/* ... rest of the page ... */}
    </div>
  );
} 