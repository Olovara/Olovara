import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Clock, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import "react-quill/dist/quill.snow.css";
import BlogComments from "@/components/blog/BlogComments";
import { decryptName } from "@/lib/encryption";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = params;

  // Fetch the blog post
  const post = await db.blogPost.findUnique({
    where: { slug },
    include: {
      cat: true,
      user: {
        select: {
          image: true,
          encryptedFirstName: true,
          firstNameIV: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  // Check if post is published and public (only show published, public posts to public)
  if (post.status !== "PUBLISHED" || post.isPrivate) {
    notFound();
  }

  // Increment view count
  await db.blogPost.update({
    where: { slug },
    data: { views: { increment: 1 } },
  });

  // Get author name
  const getAuthorName = () => {
    if (post.user?.encryptedFirstName && post.user?.firstNameIV) {
      const firstName = decryptName(
        post.user.encryptedFirstName,
        post.user.firstNameIV
      );
      return firstName;
    }
    return "Anonymous";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/blog">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Button>
        </Link>
      </div>

      {/* Article Header */}
      <article className="space-y-6">
        {/* Category Badge */}
        <div>
          <Badge variant="secondary" className="mb-4">
            {post.cat.title}
          </Badge>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>

        {/* Meta Information */}
        <div className="flex items-center gap-6 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <span>By {getAuthorName()}</span>
          </div>
          {post.publishedAt && (
            <div className="flex items-center gap-2">
              <span>
                {formatDistanceToNow(new Date(post.publishedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}
          {post.readTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{post.views} views</span>
          </div>
        </div>

        {/* Featured Image */}
        {post.img && (
          <div className="aspect-video overflow-hidden rounded-lg relative">
            <Image
              src={post.img}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
        )}

        {/* Description */}
        <p className="text-xl text-muted-foreground leading-relaxed">
          {post.description}
        </p>

        <Separator />

        {/* Content */}
        <div className="prose max-w-none ql-snow">
          <div
            className="ql-editor"
            dangerouslySetInnerHTML={{ __html: post.content as string }}
          />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Tags:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Keywords (SEO) */}
        {post.keywords && post.keywords.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Keywords:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <BlogComments postSlug={post.slug} allowComments={post.allowComments} />
      </article>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = params;

  const post = await db.blogPost.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      status: true,
      isPrivate: true,
      metaTitle: true,
      metaDescription: true,
      keywords: true,
      tags: true,
      ogImage: true,
      ogTitle: true,
      ogDescription: true,
      publishedAt: true,
      user: {
        select: {
          encryptedFirstName: true,
          firstNameIV: true,
        },
      },
    },
  });

  if (!post || post.status !== "PUBLISHED" || post.isPrivate) {
    return {
      title: "Post Not Found",
    };
  }

  // Helper function to get author name
  const getAuthorName = () => {
    if (post.user?.encryptedFirstName && post.user?.firstNameIV) {
      const firstName = decryptName(
        post.user.encryptedFirstName,
        post.user.firstNameIV
      );
      return firstName;
    }
    return "Anonymous";
  };

  // Combine keywords and tags for better SEO
  const allKeywords = [...(post.keywords || []), ...(post.tags || [])].filter(
    Boolean
  );

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.description,
    keywords: allKeywords.length > 0 ? allKeywords.join(", ") : undefined,
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description:
        post.ogDescription || post.metaDescription || post.description,
      images: post.ogImage ? [post.ogImage] : [],
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: getAuthorName() !== "Anonymous" ? [getAuthorName()] : [],
      tags: post.tags || [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.ogTitle || post.metaTitle || post.title,
      description:
        post.ogDescription || post.metaDescription || post.description,
      images: post.ogImage ? [post.ogImage] : [],
    },
    // Additional SEO metadata
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
