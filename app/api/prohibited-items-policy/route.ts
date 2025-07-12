import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/data/roles-and-permissions";

const defaultPolicy = {
  html: `
    <h1>Prohibited Items Policy</h1>
    <p>Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>1. General Prohibitions</h2>
    <p>The following items are strictly prohibited on Yarnnu:</p>
    <ul>
      <li>Items that violate intellectual property rights</li>
      <li>Counterfeit or replica items</li>
      <li>Items that promote hate, violence, or discrimination</li>
      <li>Illegal items or items that promote illegal activities</li>
      <li>Items that contain hazardous materials</li>
    </ul>

    <h2>2. Handmade Requirements</h2>
    <p>All items must be handmade or handcrafted. The following are not allowed:</p>
    <ul>
      <li>Mass-produced items</li>
      <li>Items made entirely by machine</li>
      <li>Items assembled from pre-made components without significant modification</li>
      <li>Resale of commercially manufactured items</li>
    </ul>

    <h2>3. Digital Products</h2>
    <p>Digital products must be original creations. The following are prohibited:</p>
    <ul>
      <li>Pirated or unauthorized copies of digital content</li>
      <li>Digital products that infringe on copyrights</li>
      <li>Digital products containing malware or harmful code</li>
    </ul>

    <h2>4. Age Restrictions</h2>
    <p>Items that are age-restricted or require special handling:</p>
    <ul>
      <li>Alcohol and tobacco products</li>
      <li>Weapons or weapon accessories</li>
      <li>Adult content (must be properly marked as NSFW)</li>
    </ul>

    <h2>5. Contact Us</h2>
    <p>If you have any questions about our prohibited items policy, please contact us at:</p>
    <ul>
      <li>Email: compliance@yarnnu.com</li>
      <li>Address: [Your Business Address]</li>
    </ul>
  `,
  text: `Prohibited Items Policy - Last updated: ${new Date().toLocaleDateString()}

1. General Prohibitions
The following items are strictly prohibited on Yarnnu:
- Items that violate intellectual property rights
- Counterfeit or replica items
- Items that promote hate, violence, or discrimination
- Illegal items or items that promote illegal activities
- Items that contain hazardous materials

2. Handmade Requirements
All items must be handmade or handcrafted. The following are not allowed:
- Mass-produced items
- Items made entirely by machine
- Items assembled from pre-made components without significant modification
- Resale of commercially manufactured items

3. Digital Products
Digital products must be original creations. The following are prohibited:
- Pirated or unauthorized copies of digital content
- Digital products that infringe on copyrights
- Digital products containing malware or harmful code

4. Age Restrictions
Items that are age-restricted or require special handling:
- Alcohol and tobacco products
- Weapons or weapon accessories
- Adult content (must be properly marked as NSFW)

5. Contact Us
If you have any questions about our prohibited items policy, please contact us at:
- Email: compliance@yarnnu.com
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
    const policy = await db.prohibitedItemsPolicy.findFirst();
    
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
    console.error("Error in GET /api/prohibited-items-policy:", error);
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
  const existingPolicy = await db.prohibitedItemsPolicy.findFirst();
  
  if (existingPolicy) {
    // Update existing policy
    const updatedPolicy = await db.prohibitedItemsPolicy.update({
      where: { id: existingPolicy.id },
      data: { 
        content: formattedContent,
        updatedAt: new Date()
      }
    });
    return NextResponse.json(updatedPolicy);
  } else {
    // Create new policy if none exist
    const newPolicy = await db.prohibitedItemsPolicy.create({
      data: { 
        content: formattedContent,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return NextResponse.json(newPolicy);
  }
} 