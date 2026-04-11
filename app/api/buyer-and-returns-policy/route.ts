import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/data/roles-and-permissions";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

const defaultPolicy = {
  html: `
    <h1>Buyer and Returns Policy</h1>
    <p>Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>1. Order Processing</h2>
    <p>When you place an order on OLOVARA, the following process occurs:</p>
    <ul>
      <li>You will receive an order confirmation email</li>
      <li>The seller will be notified of your order</li>
      <li>The seller will prepare and ship your item</li>
      <li>You will receive tracking information when available</li>
    </ul>

    <h2>2. Shipping Times</h2>
    <p>Shipping times vary by seller and product type:</p>
    <ul>
      <li>Digital products: Usually delivered immediately</li>
      <li>Physical products: Typically shipped within 1-3 business days</li>
      <li>Custom orders: May take longer based on seller's production time</li>
    </ul>

    <h2>3. Returns and Refunds</h2>
    <p>Our return policy is designed to be fair to both buyers and sellers:</p>
    <ul>
      <li>Returns must be initiated within 14 days of delivery</li>
      <li>Items must be in original condition</li>
      <li>Digital products are generally non-refundable</li>
      <li>Custom orders may not be eligible for returns</li>
    </ul>

    <h2>4. Return Process</h2>
    <p>To initiate a return:</p>
    <ol>
      <li>Contact the seller directly through our messaging system</li>
      <li>Explain the reason for the return</li>
      <li>Wait for seller's approval</li>
      <li>Ship the item back to the seller</li>
      <li>Once received, the seller will process your refund</li>
    </ol>

    <h2>5. Refund Processing</h2>
    <p>Refunds are processed as follows:</p>
    <ul>
      <li>Original payment method will be credited</li>
      <li>Processing time varies by payment provider</li>
      <li>Shipping costs may not be refundable</li>
    </ul>

    <h2>6. Disputes and Resolution</h2>
    <p>If you encounter any issues:</p>
    <ul>
      <li>First, try to resolve directly with the seller</li>
      <li>If unresolved, contact OLOVARA support</li>
      <li>We will mediate and help find a fair solution</li>
    </ul>

    <h2>7. Contact Us</h2>
    <p>If you have any questions about our buyer and returns policy, please contact us at:</p>
    <ul>
      <li>Email: support@olovara.com</li>
      <li>Address: [Your Business Address]</li>
    </ul>
  `,
  text: `Buyer and Returns Policy - Last updated: ${new Date().toLocaleDateString()}

1. Order Processing
When you place an order on OLOVARA, the following process occurs:
- You will receive an order confirmation email
- The seller will be notified of your order
- The seller will prepare and ship your item
- You will receive tracking information when available

2. Shipping Times
Shipping times vary by seller and product type:
- Digital products: Usually delivered immediately
- Physical products: Typically shipped within 1-3 business days
- Custom orders: May take longer based on seller's production time

3. Returns and Refunds
Our return policy is designed to be fair to both buyers and sellers:
- Returns must be initiated within 14 days of delivery
- Items must be in original condition
- Digital products are generally non-refundable
- Custom orders may not be eligible for returns

4. Return Process
To initiate a return:
1. Contact the seller directly through our messaging system
2. Explain the reason for the return
3. Wait for seller's approval
4. Ship the item back to the seller
5. Once received, the seller will process your refund

5. Refund Processing
Refunds are processed as follows:
- Original payment method will be credited
- Processing time varies by payment provider
- Shipping costs may not be refundable

6. Disputes and Resolution
If you encounter any issues:
- First, try to resolve directly with the seller
- If unresolved, contact OLOVARA support
- We will mediate and help find a fair solution

7. Contact Us
If you have any questions about our buyer and returns policy, please contact us at:
- Email: support@olovara.com
- Address: [Your Business Address]`,
};

// Add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Try to get existing policy
    const policy = await db.buyerAndReturnsPolicy.findFirst();

    if (!policy) {
      // If no policy exists, return default policy
      return NextResponse.json({
        content: defaultPolicy,
        updatedAt: new Date(),
      });
    }

    // Process the content
    let responseContent = { html: "", text: "" };

    if (policy.content && typeof policy.content === "object") {
      const content = policy.content as any;
      responseContent.html = content.html || defaultPolicy.html;
      responseContent.text = content.text || defaultPolicy.text;
    } else {
      // If content is not in expected format, return default policy
      return NextResponse.json({
        content: defaultPolicy,
        updatedAt: policy.updatedAt,
      });
    }

    return NextResponse.json({
      content: responseContent,
      updatedAt: policy.updatedAt,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in GET /api/buyer-and-returns-policy:", error);

    // Log to database - user could email about "can't load policy"
    logError({
      code: "BUYER_RETURNS_POLICY_FETCH_FAILED",
      userId: undefined, // Public route
      route: "/api/buyer-and-returns-policy",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch buyer and returns policy",
      },
    });

    // Return default policy in case of error
    return NextResponse.json({
      content: defaultPolicy,
      updatedAt: new Date(),
    });
  }
}

export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch user permissions from database
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { permissions: true },
    });

    if (!dbUser?.permissions?.includes("MANAGE_POLICIES")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    body = await req.json();
    const { content } = body;

    // Ensure content is in the correct format
    const formattedContent = {
      html: content?.html || "",
      text: content?.text || content?.html?.replace(/<[^>]*>?/gm, "") || "",
    };

    // First, try to find existing policy
    const existingPolicy = await db.buyerAndReturnsPolicy.findFirst();

    if (existingPolicy) {
      // Update existing policy
      const updatedPolicy = await db.buyerAndReturnsPolicy.update({
        where: { id: existingPolicy.id },
        data: {
          content: formattedContent,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updatedPolicy);
    } else {
      // Create new policy if none exist
      const newPolicy = await db.buyerAndReturnsPolicy.create({
        data: {
          content: formattedContent,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(newPolicy);
    }
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in POST /api/buyer-and-returns-policy:", error);

    // Log to database - admin could email about "couldn't update policy"
    const userMessage = logError({
      code: "BUYER_RETURNS_POLICY_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/buyer-and-returns-policy",
      method: "POST",
      error,
      metadata: {
        note: "Failed to update buyer and returns policy",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
