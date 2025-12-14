import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/data/roles-and-permissions";
import { logError } from "@/lib/error-logger";

const defaultTerms = {
  html: `
    <h1>Terms of Service</h1>
    <p>Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By accessing and using Yarnnu, you accept and agree to be bound by the terms and provision of this agreement.</p>

    <h2>2. Description of Service</h2>
    <p>Yarnnu provides a platform for users to buy and sell handmade products. We are not involved in the actual transaction between buyers and sellers.</p>

    <h2>3. User Accounts</h2>
    <p>To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process.</p>

    <h2>4. Prohibited Activities</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Use the Service for any illegal purpose</li>
      <li>Violate any laws in your jurisdiction</li>
      <li>Infringe upon the rights of others</li>
      <li>Interfere with or disrupt the Service</li>
      <li>Attempt to gain unauthorized access to the Service</li>
    </ul>

    <h2>5. Intellectual Property</h2>
    <p>The Service and its original content, features, and functionality are owned by Yarnnu and are protected by international copyright, trademark, and other intellectual property laws.</p>

    <h2>6. Limitation of Liability</h2>
    <p>In no event shall Yarnnu, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>

    <h2>7. Changes to Terms</h2>
    <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.</p>

    <h2>8. Contact Us</h2>
    <p>If you have any questions about these Terms, please contact us at:</p>
    <ul>
      <li>Email: legal@yarnnu.com</li>
      <li>Address: [Reminder to Add Our Business Address]</li>
    </ul>
  `,
  text: `Terms of Service - Last updated: ${new Date().toLocaleDateString()}

1. Acceptance of Terms
By accessing and using Yarnnu, you accept and agree to be bound by the terms and provision of this agreement.

2. Description of Service
Yarnnu provides a platform for users to buy and sell handmade products. We are not involved in the actual transaction between buyers and sellers.

3. User Accounts
To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process.

4. Prohibited Activities
You agree not to:
- Use the Service for any illegal purpose
- Violate any laws in your jurisdiction
- Infringe upon the rights of others
- Interfere with or disrupt the Service
- Attempt to gain unauthorized access to the Service

5. Intellectual Property
The Service and its original content, features, and functionality are owned by Yarnnu and are protected by international copyright, trademark, and other intellectual property laws.

6. Limitation of Liability
In no event shall Yarnnu, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.

7. Changes to Terms
We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.

8. Contact Us
If you have any questions about these Terms, please contact us at:
- Email: legal@yarnnu.com
- Address: [Reminder to Add Our Business Address]`,
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
    const terms = await db.termsOfService.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!terms) {
      return NextResponse.json(defaultTerms);
    }

    return NextResponse.json(terms);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching terms of service:", error);

    // Log to database - user could email about "can't load terms"
    const userMessage = logError({
      code: "TERMS_OF_SERVICE_FETCH_FAILED",
      userId: undefined, // Public route
      route: "/api/terms-of-service",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch terms of service",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
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

    // First, try to find existing terms
    const existingTerms = await db.termsOfService.findFirst();

    if (existingTerms) {
      // Update existing terms
      const updatedTerms = await db.termsOfService.update({
        where: { id: existingTerms.id },
        data: { content: formattedContent },
      });
      return NextResponse.json(updatedTerms);
    } else {
      // Create new terms if none exist
      const newTerms = await db.termsOfService.create({
        data: { content: formattedContent },
      });
      return NextResponse.json(newTerms);
    }
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in POST /api/terms-of-service:", error);

    // Log to database - admin could email about "couldn't update terms"
    const userMessage = logError({
      code: "TERMS_OF_SERVICE_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/terms-of-service",
      method: "POST",
      error,
      metadata: {
        note: "Failed to update terms of service",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
