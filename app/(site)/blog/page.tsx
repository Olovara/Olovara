import { db } from "@/lib/db";
import { BlogCard } from "./_components/blog-card";
import { CategoryFilter } from "./_components/category-filter";
import { BlogActions } from "./_components/blog-actions";
import { decryptData } from "@/lib/encryption";

interface BlogPageProps {
  searchParams: {
    category?: string;
  };
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  img?: string | null;
  publishedAt: Date | null;
  readTime?: number | null;
  cat: {
    title: string;
    slug: string;
  };
  user: {
    encryptedFirstName?: string | null;
    firstNameIV?: string | null;
    image: string | null;
  };
}

const BlogPage = async ({ searchParams }: BlogPageProps) => {
  // Fetch all categories
  const categories = await db.blogCategory.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: "asc",
    },
  });

  // Fetch blog posts with optional category filter
  const posts = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      isPrivate: false, // Only show public posts
      ...(searchParams.category && {
        catSlug: searchParams.category,
      }),
    },
    include: {
      cat: true,
      user: {
        select: {
          image: true,
          encryptedFirstName: true,
          firstNameIV: true,
          firstNameSalt: true,
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  // Decrypt author names for each post
  const postsWithDecryptedNames = posts.map((post) => ({
    ...post,
    user: {
      ...post.user,
             firstName:
         post.user.encryptedFirstName && post.user.firstNameIV && post.user.firstNameSalt
           ? decryptData(
               post.user.encryptedFirstName,
               post.user.firstNameIV,
               post.user.firstNameSalt
             )
           : null,
    },
  })) as BlogPost[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover articles, guides, and insights about handmade crafts,
            selling tips, and marketplace updates.
          </p>
        </div>

        {/* Action Buttons - Only visible to users with permissions */}
        <BlogActions />

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={searchParams.category}
        />

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postsWithDecryptedNames.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground">
              {searchParams.category
                ? "No posts found in this category. Check back later!"
                : "No posts available yet. Check back soon!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;

// Generate metadata for the blog page
export async function generateMetadata({ searchParams }: BlogPageProps) {
  const category = searchParams.category;

  const title = category
    ? `Blog - ${category.charAt(0).toUpperCase() + category.slice(1)} Category`
    : "Blog - Handmade Crafts, Selling Tips & Marketplace Updates";

  const description = category
    ? `Explore ${category} articles, guides, and insights about handmade crafts, selling tips, and marketplace updates.`
    : "Discover articles, guides, and insights about handmade crafts, selling tips, and marketplace updates.";

  return {
    title,
    description,
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
    robots: {
      index: true,
      follow: true,
    },
  };
}
