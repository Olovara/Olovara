// This webhook endpoint is deprecated. 
// All webhook processing is now handled by /api/stripe/webhooks/route.ts
// This file is kept for backward compatibility but should not be used.

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.warn("⚠️ DEPRECATED: Using old webhook endpoint. Please update Stripe webhook URL to /api/stripe/webhooks");
  
  // Redirect to the proper webhook handler
  const webhookUrl = new URL('/api/stripe/webhooks', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  
  try {
    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: req.headers,
      body: req.body,
    });
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error("❌ Error forwarding to proper webhook:", error);
    return NextResponse.json({ error: "Webhook forwarding failed" }, { status: 500 });
  }
}