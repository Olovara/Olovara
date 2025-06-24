import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, PackageOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Order, Review, Message } from "@prisma/client";
import { getBuyerOrders } from "@/actions/orders";
import { redirect } from "next/navigation";

interface OrderWithRelations {
  id: string;
  userId: string;
  sellerId: string;
  shopName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  productPrice: number;
  shippingCost: number;
  stripeFee: number;
  isDigital: boolean;
  status: string;
  paymentStatus: string;
  stripeSessionId: string;
  stripeTransferId: string | null;
  encryptedBuyerEmail: string;
  buyerEmailIV: string;
  encryptedBuyerName: string;
  buyerNameIV: string;
  encryptedShippingAddress: string;
  shippingAddressIV: string;
  discount: any | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    name: string;
    images: string[];
  };
  seller: {
    id: string;
    userId: string;
    shopName: string;
  } | null;
  buyerEmail?: string;
  buyerName?: string;
  shippingAddress?: any | null;
}

interface ReviewWithRelations extends Review {
  product: {
    name: string;
    images: string[];
  } | null;
  reviewed: {
    username: string | null;
  };
}

interface MessageWithRelations extends Message {
  conversation: {
    users: {
      user: {
        username: string | null;
        image: string | null;
      };
    }[];
  };
}

export default async function MemberDashboard() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch pending reviews
  const pendingReviews = await db.review.findMany({
    where: {
      reviewerId: session.user.id,
      status: "PENDING",
    },
    include: {
      product: {
        select: {
          name: true,
          images: true,
        },
      },
      reviewed: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      expiresAt: "asc",
    },
    take: 3,
  }) as ReviewWithRelations[];

  // Fetch recent purchases using the existing function
  const recentPurchases = await getBuyerOrders(session.user.id);
  const validPurchases = recentPurchases.slice(0, 3);

  // Fetch recent messages
  const recentMessages = await db.message.findMany({
    where: {
      senderId: session.user.id,
    },
    include: {
      conversation: {
        include: {
          users: {
            where: {
              userId: {
                not: session.user.id,
              },
            },
            include: {
              user: {
                select: {
                  username: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  }) as MessageWithRelations[];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Reviews Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {pendingReviews.length > 0 ? (
              <div className="space-y-4">
                {pendingReviews.map((review) => (
                  <div key={review.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {review.type === "PRODUCT" 
                          ? review.product?.name 
                          : review.reviewed?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {formatDistanceToNow(new Date(review.expiresAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Link href={`/member/dashboard/reviews`}>
                      <Button variant="outline" size="sm">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending reviews</p>
            )}
            <div className="mt-4">
              <Link href="/member/dashboard/reviews">
                <Button variant="ghost" className="w-full">View All Reviews</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Purchases Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Purchases</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {validPurchases.length > 0 ? (
              <div className="space-y-4">
                {validPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{purchase.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {purchase.shopName}
                      </p>
                    </div>
                    <Link href={`/member/dashboard/my-purchases`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent purchases</p>
            )}
            <div className="mt-4">
              <Link href="/member/dashboard/my-purchases">
                <Button variant="ghost" className="w-full">View All Purchases</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentMessages.length > 0 ? (
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div key={message.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {message.conversation.users[0]?.user.username || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {message.content}
                      </p>
                    </div>
                    <Link href={`/member/dashboard/messages`}>
                      <Button variant="outline" size="sm">Reply</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent messages</p>
            )}
            <div className="mt-4">
              <Link href="/member/dashboard/messages">
                <Button variant="ghost" className="w-full">View All Messages</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}