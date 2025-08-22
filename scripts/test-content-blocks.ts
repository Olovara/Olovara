import { db } from "@/lib/db";
import { ContentBlock } from "@/components/blog/types/BlockTypes";

// Test content blocks
const testBlocks: ContentBlock[] = [
  {
    id: "1",
    type: "alert",
    order: 1,
    variant: "info",
    title: "Test Alert",
    content: "This is a test alert to verify the content blocks system is working!",
    icon: "Info",
  },
  {
    id: "2",
    type: "card",
    order: 2,
    variant: "feature",
    title: "Test Feature Card",
    content: "This is a test feature card with beautiful styling and icons.",
    icon: "Star",
    color: "purple",
  },
  {
    id: "3",
    type: "step",
    order: 3,
    stepNumber: 1,
    title: "Test Step Guide",
    description: "This is a test step guide to verify the system works.",
    details: ["Detail 1", "Detail 2", "Detail 3"],
    tips: ["Tip 1", "Tip 2"],
    estimatedTime: "5 minutes",
    icon: "Settings",
  },
];

async function testContentBlocks() {
  try {
    console.log("Testing content blocks system...");

    // Check if we can find any existing blog posts
    const existingPosts = await db.blogPost.findMany({
      take: 1,
      select: {
        id: true,
        title: true,
        contentBlocks: true,
      },
    });

    if (existingPosts.length > 0) {
      const post = existingPosts[0];
      console.log("Found existing post:", post.title);
      console.log("Current contentBlocks:", post.contentBlocks);

      // Update the first post with test content blocks
      const updatedPost = await db.blogPost.update({
        where: { id: post.id },
        data: {
          contentBlocks: testBlocks,
        },
        select: {
          id: true,
          title: true,
          contentBlocks: true,
        },
      });

      console.log("Updated post with content blocks:", updatedPost);
      console.log("✅ Content blocks system is working!");
    } else {
      console.log("No existing posts found. Create a blog post first to test.");
    }

  } catch (error) {
    console.error("❌ Error testing content blocks:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testContentBlocks();
