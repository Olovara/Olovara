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
import { ContentBlockRenderer } from "@/components/blog";
import { ContentBlock } from "@/components/blog/types/BlockTypes";
import { decryptData } from "@/lib/encryption";
import { Metadata } from "next";

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
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      contentBlocks: true,
      img: true,
      status: true,
      isPrivate: true,
      createdAt: true,
      publishedAt: true,
      readTime: true,
      views: true,
      tags: true,
      keywords: true,
      allowComments: true,
      slug: true,
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
    if (
      post.user?.encryptedFirstName &&
      post.user?.firstNameIV &&
      post.user?.firstNameSalt
    ) {
      const firstName = decryptData(
        post.user.encryptedFirstName,
        post.user.firstNameIV,
        post.user.firstNameSalt
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
          {post.createdAt &&
            post.publishedAt &&
            post.createdAt.toDateString() !==
              post.publishedAt.toDateString() && (
              <div className="flex items-center gap-2">
                <span>
                  Written{" "}
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          {post.publishedAt && (
            <div className="flex items-center gap-2">
              <span>
                {post.createdAt &&
                post.publishedAt &&
                post.createdAt.toDateString() ===
                  post.publishedAt.toDateString()
                  ? "Written"
                  : "Updated"}{" "}
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

        {/* Structured Content Blocks */}
        {post.contentBlocks &&
          Array.isArray(post.contentBlocks) &&
          post.contentBlocks.length > 0 && (
            <div className="space-y-8">
              <ContentBlockRenderer
                blocks={post.contentBlocks as unknown as ContentBlock[]}
                className="space-y-6"
              />
            </div>
          )}

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
              {post.tags.map((tag: string) => (
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
              {post.keywords.map((keyword: string) => (
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

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = params;

  // Fetch the blog post for metadata
  const post = await db.blogPost.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      content: true,
      img: true,
      status: true,
      isPrivate: true,
      publishedAt: true,
      tags: true,
      keywords: true,
      // SEO fields
      metaTitle: true,
      metaDescription: true,
      canonicalUrl: true,
      // OpenGraph fields
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
      cat: {
        select: {
          title: true,
          slug: true,
        },
      },
      user: {
        select: {
          encryptedFirstName: true,
          firstNameIV: true,
          firstNameSalt: true,
        },
      },
    },
  });

  if (!post || post.status !== "PUBLISHED" || post.isPrivate) {
    return {
      title: "Blog Post Not Found | Yarnnu",
      description: "The requested blog post could not be found.",
    };
  }

  // Get author name
  const getAuthorName = () => {
    if (
      post.user?.encryptedFirstName &&
      post.user?.firstNameIV &&
      post.user?.firstNameSalt
    ) {
      const firstName = decryptData(
        post.user.encryptedFirstName,
        post.user.firstNameIV,
        post.user.firstNameSalt
      );
      return firstName;
    }
    return "Anonymous";
  };

  const authorName = getAuthorName();

  // Use custom SEO fields if available, fallback to generated ones
  const seoTitle =
    post.metaTitle || `${post.title} | Handmade Crafts Blog | Yarnnu`;
  const seoDescription =
    post.metaDescription ||
    post.description
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .substring(0, 160); // Limit to 160 characters

  // Generate comprehensive keywords from all available sources
  const keywords = [
    ...(post.keywords || []),
    ...(post.tags || []),
    post.cat.title,
    "handmade crafts",
    "artisan blog",
    "handmade business",
    "craft tutorials",
    "handmade marketplace",
    "artisan tips",
    authorName !== "Anonymous" ? `by ${authorName}` : null,
  ].filter(Boolean);

  // Use custom OpenGraph fields if available, fallback to SEO fields
  const ogTitle = post.ogTitle || post.metaTitle || post.title;
  const ogDescription =
    post.ogDescription || post.metaDescription || seoDescription;
  const ogImage = post.ogImage || post.img;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: keywords.join(", "),
    authors: [{ name: authorName }],
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [authorName],
      tags: post.tags || [],
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: {
      canonical: post.canonicalUrl || `/blog/${slug}`,
    },
  };
}
