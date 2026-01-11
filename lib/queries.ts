"use server";

import { db } from "./db";
import {
  Website,
  WebsitePage,
  SubscriptionPlan,
  SellerSubscription,
  WebsiteTemplate,
} from "@prisma/client";
import {
  WebsiteWithPages,
  WebsitePageWithWebsite,
  SellerWithWebsiteAndSubscription,
  SellerSubscriptionWithPlan,
  WebsiteTemplateWithContent,
} from "@/types/websiteBuilder";
import { revalidatePath } from "next/cache";

// Seller Queries
export const getSellerByUserId = async (userId: string) => {
  const seller = await db.seller.findUnique({
    where: { userId },
    include: {
      website: {
        include: {
          pages: {
            orderBy: { order: "asc" },
          },
        },
      },
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });
  return seller;
};

// Website Queries
export const getWebsiteDetails = async (websiteId: string) => {
  const website = await db.website.findUnique({
    where: { id: websiteId },
    include: {
      pages: {
        orderBy: { order: "asc" },
      },
      seller: true,
    },
  });
  return website;
};

export const getWebsiteBySellerId = async (sellerId: string) => {
  const website = await db.website.findUnique({
    where: { sellerId },
    include: {
      pages: {
        orderBy: { order: "asc" },
      },
    },
  });
  return website;
};

export const getWebsitePageDetails = async (pageId: string) => {
  const page = await db.websitePage.findUnique({
    where: { id: pageId },
    include: {
      website: {
        include: {
          seller: true,
        },
      },
    },
  });

  // Check if the page exists and has a valid website with seller
  if (!page || !page.website || !page.website.seller) {
    return null;
  }

  return page;
};

export const getWebsitePageByPath = async (
  websiteId: string,
  pathName: string
) => {
  const page = await db.websitePage.findFirst({
    where: {
      websiteId,
      pathName: pathName || "",
      isPublished: true,
    },
    include: {
      website: {
        include: {
          seller: true,
        },
      },
    },
  });

  // Check if the page exists and has a valid website with seller
  if (!page || !page.website || !page.website.seller) {
    return null;
  }

  return page;
};

export const getHomepage = async (websiteId: string) => {
  const page = await db.websitePage.findFirst({
    where: {
      websiteId,
      isHomepage: true,
      isPublished: true,
    },
    include: {
      website: {
        include: {
          seller: true,
        },
      },
    },
  });

  // Check if the page exists and has a valid website with seller
  if (!page || !page.website || !page.website.seller) {
    return null;
  }

  return page;
};

// Website CRUD Operations
export const createWebsite = async (
  sellerId: string,
  data: {
    name: string;
    description?: string;
    theme?: string;
  }
) => {
  const website = await db.website.create({
    data: {
      sellerId,
      name: data.name,
      description: data.description,
      theme: data.theme,
      websiteSlug: data.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    },
  });

  // Create a default homepage
  await db.websitePage.create({
    data: {
      websiteId: website.id,
      name: "Home",
      pathName: "",
      isHomepage: true,
      isPublished: true,
      order: 0,
      content: JSON.stringify([
        {
          content: [],
          id: "__body",
          name: "Body",
          styles: { backgroundColor: "white" },
          type: "__body",
        },
      ]),
    },
  });

  revalidatePath(`/seller/dashboard/website-builder`);
  return website;
};

export const updateWebsite = async (
  websiteId: string,
  data: {
    name?: string;
    description?: string;
    published?: boolean;
    subDomainName?: string;
    customDomain?: string;
    theme?: string;
    settings?: any;
    seoTitle?: string;
    seoDescription?: string;
    ogImage?: string;
  }
) => {
  const website = await db.website.update({
    where: { id: websiteId },
    data,
  });

  revalidatePath(`/seller/dashboard/website-builder`);
  return website;
};

export const deleteWebsite = async (websiteId: string) => {
  const website = await db.website.delete({
    where: { id: websiteId },
  });

  revalidatePath(`/seller/dashboard/website-builder`);
  return website;
};

// Website Page CRUD Operations
export const createWebsitePage = async (
  websiteId: string,
  data: {
    name: string;
    pathName?: string;
    isHomepage?: boolean;
    content?: string;
  }
) => {
  // If this is set as homepage, unset other homepages
  if (data.isHomepage) {
    await db.websitePage.updateMany({
      where: { websiteId, isHomepage: true },
      data: { isHomepage: false },
    });
  }

  // Get the next order number
  const lastPage = await db.websitePage.findFirst({
    where: { websiteId },
    orderBy: { order: "desc" },
  });
  const nextOrder = (lastPage?.order || 0) + 1;

  const page = await db.websitePage.create({
    data: {
      websiteId,
      name: data.name,
      pathName:
        data.pathName ||
        data.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      isHomepage: data.isHomepage || false,
      order: nextOrder,
      content:
        data.content ||
        JSON.stringify([
          {
            content: [],
            id: "__body",
            name: "Body",
            styles: { backgroundColor: "white" },
            type: "__body",
          },
        ]),
    },
  });

  revalidatePath(`/seller/dashboard/website-builder`);
  return page;
};

export const updateWebsitePage = async (
  pageId: string,
  data: {
    name?: string;
    pathName?: string;
    content?: string;
    isPublished?: boolean;
    isHomepage?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    ogImage?: string;
  }
) => {
  // If this is set as homepage, unset other homepages
  if (data.isHomepage) {
    const page = await db.websitePage.findUnique({
      where: { id: pageId },
      select: { websiteId: true },
    });
    if (page) {
      await db.websitePage.updateMany({
        where: { websiteId: page.websiteId, isHomepage: true },
        data: { isHomepage: false },
      });
    }
  }

  const updatedPage = await db.websitePage.update({
    where: { id: pageId },
    data,
  });

  revalidatePath(`/seller/dashboard/website-builder`);
  return updatedPage;
};

export const reorderWebsitePages = async (
  websiteId: string,
  pageOrders: { id: string; order: number }[]
) => {
  const updatePromises = pageOrders.map(({ id, order }) =>
    db.websitePage.update({
      where: { id },
      data: { order },
    })
  );

  await db.$transaction(updatePromises);
  revalidatePath(`/seller/dashboard/website-builder`);
};

// Subscription Queries
export const getSubscriptionPlans = async (canAccessTest: boolean = false) => {
  const plans = await db.subscriptionPlan.findMany({
    where: { 
      isActive: true,
      // Filter out free test plans (MAKER_FREE, STUDIO_FREE) unless user has test environment access
      ...(canAccessTest ? {} : {
        name: {
          notIn: ['MAKER_FREE', 'STUDIO_FREE']
        }
      })
    },
    orderBy: { price: "asc" },
  });

  // Transform the plans to match the expected type
  return plans.map((plan) => ({
    ...plan,
    features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
  }));
};

// Website Page Functions
export const getWebsite = async (websiteId: string) => {
  const website = await db.website.findUnique({
    where: { id: websiteId },
    include: {
      pages: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return website;
};

{
  /* export const updateWebsiteProducts = async (
  products: string,
  websiteId: string
) => {
  const data = await db.website.update({
    where: { id: websiteId },
    data: { liveProducts: products },
  });
  return data;
}; */
}

export const upsertWebsitePage = async (
  sellerId: string,
  websitePage: {
    id?: string;
    name: string;
    pathName?: string;
    content?: string | null;
    isPublished?: boolean;
    isHomepage?: boolean;
    seoTitle?: string | null;
    seoDescription?: string | null;
    ogImage?: string | null;
    order?: number;
  },
  websiteId: string
) => {
  if (!sellerId || !websiteId) return;
  const response = await db.websitePage.upsert({
    where: { id: websitePage.id || "" },
    update: { ...websitePage },
    create: {
      ...websitePage,
      content: websitePage.content
        ? websitePage.content
        : JSON.stringify([
            {
              content: [],
              id: "__body",
              name: "Body",
              styles: { backgroundColor: "white" },
              type: "__body",
            },
          ]),
      websiteId,
    },
  });

  revalidatePath(`/seller/${sellerId}/websites/${websiteId}`, "page");
  return response;
};

export const deleteWebsitePage = async (websitePageId: string) => {
  const response = await db.websitePage.delete({
    where: { id: websitePageId },
  });

  return response;
};

// Activity Logs Function
export const saveActivityLogsNotification = async (data: {
  description: string;
  sellerId: string;
}) => {
  // For now, we'll just log to console
  // In a real app, you might want to save this to a database
  console.log("Activity Log:", data);
  return { success: true };
};

export const getSellerSubscription = async (sellerId: string) => {
  const subscription = await db.sellerSubscription.findUnique({
    where: { sellerId },
    include: {
      plan: true,
    },
  });
  return subscription;
};

export const createSellerSubscription = async (
  sellerId: string,
  planId: string,
  data: {
    stripeSubscriptionId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEndsAt?: Date;
    status?: string;
  }
) => {
  const subscription = await db.sellerSubscription.create({
    data: {
      sellerId,
      planId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEndsAt: data.trialEndsAt,
      status: data.status || "ACTIVE",
    },
    include: {
      plan: true,
    },
  });

  revalidatePath(`/seller/dashboard/subscription`);
  return subscription;
};

export const updateSellerSubscription = async (
  sellerId: string,
  data: {
    status?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    websiteEnabled?: boolean;
    customDomain?: string;
    websiteSlug?: string;
  }
) => {
  const subscription = await db.sellerSubscription.update({
    where: { sellerId },
    data,
    include: {
      plan: true,
    },
  });

  revalidatePath(`/seller/dashboard/subscription`);
  return subscription;
};

// Template Queries
export const getWebsiteTemplates = async (category?: string) => {
  const templates = await db.websiteTemplate.findMany({
    where: {
      isActive: true,
      ...(category && { category }),
    },
    orderBy: { name: "asc" },
  });
  return templates;
};

export const getWebsiteTemplate = async (templateId: string) => {
  const template = await db.websiteTemplate.findUnique({
    where: { id: templateId },
  });
  return template;
};

// Analytics Queries
export const incrementPageVisits = async (pageId: string) => {
  await db.websitePage.update({
    where: { id: pageId },
    data: {
      visits: {
        increment: 1,
      },
    },
  });
};

export const getWebsiteAnalytics = async (websiteId: string) => {
  const website = await db.website.findUnique({
    where: { id: websiteId },
    include: {
      pages: {
        select: {
          id: true,
          name: true,
          visits: true,
          isPublished: true,
        },
      },
    },
  });

  const totalVisits =
    website?.pages.reduce((sum, page) => sum + page.visits, 0) || 0;
  const publishedPages =
    website?.pages.filter((page) => page.isPublished).length || 0;

  return {
    website,
    totalVisits,
    publishedPages,
    totalPages: website?.pages.length || 0,
  };
};

// Utility Functions
export const checkWebsiteBuilderAccess = async (sellerId: string) => {
  const subscription = await getSellerSubscription(sellerId);

  if (!subscription) {
    return {
      hasAccess: false,
      reason: "No subscription found",
    };
  }

  if (subscription.status !== "ACTIVE") {
    return {
      hasAccess: false,
      reason: "Subscription not active",
    };
  }

  // Check if the plan includes website builder (only Studio plan)
  if (!subscription.plan.websiteBuilder) {
    return {
      hasAccess: false,
      reason: "Website builder is only available in the Studio plan",
    };
  }

  return {
    hasAccess: true,
    subscription,
  };
};

export const getSellerWithWebsiteAndSubscription = async (
  sellerId: string
): Promise<SellerWithWebsiteAndSubscription | null> => {
  const seller = await db.seller.findUnique({
    where: { userId: sellerId },
    include: {
      website: {
        include: {
          pages: {
            orderBy: { order: "asc" },
          },
        },
      },
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  return seller;
};

export const getDomainContent = async (subDomainName: string) => {
  const response = await db.website.findUnique({
    where: {
      subDomainName,
    },
    include: { pages: true },
  });
  return response;
};

// Media Queries (placeholder for future implementation)
// TODO: Implement media functionality for Yarnnu
// This will need to be adapted to work with Yarnnu's Seller model instead of SubAccount
