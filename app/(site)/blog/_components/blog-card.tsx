import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface BlogCardProps {
  post: {
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
      firstName?: string | null;
      image?: string | null;
    };
  };
}

export const BlogCard = ({ post }: BlogCardProps) => {
  // Get author name from user profile or fallback to "Anonymous"
  const authorName = post.user.firstName || "Anonymous";

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group relative flex flex-col overflow-hidden rounded-lg border bg-background transition-all hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {post.img ? (
            <Image
              src={post.img}
              alt={post.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          {/* Category */}
          <Badge variant="secondary" className="mb-2 w-fit">
            {post.cat.title}
          </Badge>

          {/* Title */}
          <h2 className="mb-2 line-clamp-2 text-xl font-semibold">
            {post.title}
          </h2>

          {/* Description */}
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {post.description}
          </p>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between">
            {/* Author */}
            <div className="flex items-center gap-2">
              {post.user.image && (
                <Image
                  src={post.user.image}
                  alt={authorName}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-muted-foreground">
                {authorName}
              </span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {post.publishedAt && (
                <span>
                  {formatDistanceToNow(new Date(post.publishedAt), {
                    addSuffix: true,
                  })}
                </span>
              )}
              {post.readTime && <span>{post.readTime} min read</span>}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};
