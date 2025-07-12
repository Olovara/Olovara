import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/data/roles-and-permissions";

const defaultPolicy = {
  html: `
    <h1>Privacy Policy</h1>
    <p>Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>1. Introduction</h2>
    <p>Welcome to Yarnnu. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>

    <h2>2. Information We Collect</h2>
    <p>We may collect, use, store and transfer different kinds of personal data about you, including:</p>
    <ul>
      <li>Identity Data (name, username)</li>
      <li>Contact Data (email address, shipping address)</li>
      <li>Financial Data (payment card details)</li>
      <li>Transaction Data (details about payments)</li>
      <li>Technical Data (IP address, browser type)</li>
      <li>Profile Data (username, password, purchases)</li>
      <li>Usage Data (how you use our website)</li>
    </ul>

    <h2>3. How We Use Your Information</h2>
    <p>We use your personal data for the following purposes:</p>
    <ul>
      <li>To process and deliver your orders</li>
      <li>To manage your account</li>
      <li>To communicate with you about your orders</li>
      <li>To improve our website and services</li>
      <li>To prevent fraud and ensure security</li>
    </ul>

    <h2>4. Data Security</h2>
    <p>We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.</p>

    <h2>5. Your Legal Rights</h2>
    <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
    <ul>
      <li>Request access to your personal data</li>
      <li>Request correction of your personal data</li>
      <li>Request erasure of your personal data</li>
      <li>Object to processing of your personal data</li>
      <li>Request restriction of processing your personal data</li>
      <li>Request transfer of your personal data</li>
      <li>Right to withdraw consent</li>
    </ul>

    <h2>6. Cookies</h2>
    <p>We use cookies and similar tracking technologies to track the activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

    <h2>7. Changes to This Privacy Policy</h2>
    <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>

    <h2>8. Contact Us</h2>
    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
    <ul>
      <li>Email: privacy@yarnnu.com</li>
      <li>Address: [Your Business Address]</li>
    </ul>
  `,
  text: `Privacy Policy - Last updated: ${new Date().toLocaleDateString()}

1. Introduction
Welcome to Yarnnu. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.

2. Information We Collect
We may collect, use, store and transfer different kinds of personal data about you, including:
- Identity Data (name, username)
- Contact Data (email address, shipping address)
- Financial Data (payment card details)
- Transaction Data (details about payments)
- Technical Data (IP address, browser type)
- Profile Data (username, password, purchases)
- Usage Data (how you use our website)

3. How We Use Your Information
We use your personal data for the following purposes:
- To process and deliver your orders
- To manage your account
- To communicate with you about your orders
- To improve our website and services
- To prevent fraud and ensure security

4. Data Security
We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.

5. Your Legal Rights
Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
- Request access to your personal data
- Request correction of your personal data
- Request erasure of your personal data
- Object to processing of your personal data
- Request restriction of processing your personal data
- Request transfer of your personal data
- Right to withdraw consent

6. Cookies
We use cookies and similar tracking technologies to track the activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.

7. Changes to This Privacy Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.

8. Contact Us
If you have any questions about this Privacy Policy, please contact us at:
- Email: privacy@yarnnu.com
- Address: [Your Business Address]`
};

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Try to get existing policy
    const policy = await db.privacyPolicy.findFirst();
    
    if (!policy) {
      // If no policy exists, return default policy
      return NextResponse.json({
        content: defaultPolicy,
        updatedAt: new Date()
      });
    }

    // Process the content
    let responseContent = { html: "", text: "" };

    if (policy.content && typeof policy.content === 'object') {
      const content = policy.content as any;
      responseContent.html = content.html || defaultPolicy.html;
      responseContent.text = content.text || defaultPolicy.text;
    } else {
      // If content is not in expected format, return default policy
      return NextResponse.json({
        content: defaultPolicy,
        updatedAt: policy.updatedAt
      });
    }

    return NextResponse.json({
      content: responseContent,
      updatedAt: policy.updatedAt
    });
  } catch (error) {
    console.error("Error in GET /api/privacy-policy:", error);
    // Return default policy in case of error
    return NextResponse.json({
      content: defaultPolicy,
      updatedAt: new Date()
    });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  // Check if user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  // Fetch user permissions from database
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true }
  });

  if (!dbUser?.permissions?.includes('MANAGE_POLICIES')) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const { content } = await req.json();
  
  // Ensure content is in the correct format
  const formattedContent = {
    html: content.html || "",
    text: content.text || content.html?.replace(/<[^>]*>?/gm, '') || ""
  };
  
  // First, try to find existing policy
  const existingPolicy = await db.privacyPolicy.findFirst();
  
  if (existingPolicy) {
    // Update existing policy
    const updatedPolicy = await db.privacyPolicy.update({
      where: { id: existingPolicy.id },
      data: { content: formattedContent }
    });
    return NextResponse.json(updatedPolicy);
  } else {
    // Create new policy if none exist
    const newPolicy = await db.privacyPolicy.create({
      data: { content: formattedContent }
    });
    return NextResponse.json(newPolicy);
  }
}
