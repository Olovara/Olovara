import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/data/roles-and-permissions";

const defaultPolicy = {
  html: `
    <h1>Copyright Infringement Policy</h1>
    <p>Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>1. Intellectual Property Rights</h2>
    <p>Yarnnu respects intellectual property rights and expects all users to do the same. We prohibit the sale of items that infringe on copyrights, trademarks, or other intellectual property rights.</p>

    <h2>2. Reporting Copyright Infringement</h2>
    <p>If you believe your intellectual property rights have been violated, please follow these steps:</p>
    <ol>
      <li>Identify the specific item(s) in question</li>
      <li>Provide proof of your ownership of the intellectual property</li>
      <li>Submit a detailed description of the alleged infringement</li>
      <li>Include your contact information</li>
    </ol>

    <h2>3. Our Response</h2>
    <p>Upon receiving a valid copyright infringement notice, we will:</p>
    <ul>
      <li>Review the claim promptly</li>
      <li>Remove the allegedly infringing content if necessary</li>
      <li>Notify the seller of the complaint</li>
      <li>Take appropriate action based on our policies</li>
    </ul>

    <h2>4. Counter-Notification</h2>
    <p>If you believe your content was removed in error, you may submit a counter-notification that includes:</p>
    <ul>
      <li>Your contact information</li>
      <li>Identification of the removed content</li>
      <li>A statement under penalty of perjury that you believe the content was removed in error</li>
      <li>Your consent to the jurisdiction of the appropriate court</li>
    </ul>

    <h2>5. Repeat Infringers</h2>
    <p>We maintain a policy of terminating the accounts of repeat infringers in appropriate circumstances.</p>

    <h2>6. Contact Us</h2>
    <p>To report copyright infringement, please contact us at:</p>
    <ul>
      <li>Email: copyright@yarnnu.com</li>
      <li>Address: [Your Business Address]</li>
    </ul>
  `,
  text: `Copyright Infringement Policy - Last updated: ${new Date().toLocaleDateString()}

1. Intellectual Property Rights
Yarnnu respects intellectual property rights and expects all users to do the same. We prohibit the sale of items that infringe on copyrights, trademarks, or other intellectual property rights.

2. Reporting Copyright Infringement
If you believe your intellectual property rights have been violated, please follow these steps:
1. Identify the specific item(s) in question
2. Provide proof of your ownership of the intellectual property
3. Submit a detailed description of the alleged infringement
4. Include your contact information

3. Our Response
Upon receiving a valid copyright infringement notice, we will:
- Review the claim promptly
- Remove the allegedly infringing content if necessary
- Notify the seller of the complaint
- Take appropriate action based on our policies

4. Counter-Notification
If you believe your content was removed in error, you may submit a counter-notification that includes:
- Your contact information
- Identification of the removed content
- A statement under penalty of perjury that you believe the content was removed in error
- Your consent to the jurisdiction of the appropriate court

5. Repeat Infringers
We maintain a policy of terminating the accounts of repeat infringers in appropriate circumstances.

6. Contact Us
To report copyright infringement, please contact us at:
- Email: copyright@yarnnu.com
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
    const policy = await db.copyrightInfringement.findFirst();
    
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
    console.error("Error in GET /api/copyright-infringement:", error);
    // Return default policy in case of error
    return NextResponse.json({
      content: defaultPolicy,
      updatedAt: new Date()
    });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { content } = await req.json();
  
  // Ensure content is in the correct format
  const formattedContent = {
    html: content.html || "",
    text: content.text || content.html?.replace(/<[^>]*>?/gm, '') || ""
  };
  
  // First, try to find existing policy
  const existingPolicy = await db.copyrightInfringement.findFirst();
  
  if (existingPolicy) {
    // Update existing policy
    const updatedPolicy = await db.copyrightInfringement.update({
      where: { id: existingPolicy.id },
      data: { 
        content: formattedContent,
        updatedAt: new Date()
      }
    });
    return NextResponse.json(updatedPolicy);
  } else {
    // Create new policy if none exist
    const newPolicy = await db.copyrightInfringement.create({
      data: { 
        content: formattedContent,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return NextResponse.json(newPolicy);
  }
} 