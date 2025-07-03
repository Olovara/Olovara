import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";
import { ROUTE_PERMISSIONS } from "@/data/roles-and-permissions";

const { auth } = NextAuth(authConfig);

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimit(identifier: string, limit: number = 100, windowMs: number = 60 * 1000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up old entries
  rateLimitStore.forEach((value, key) => {
    if (value.resetTime < windowStart) {
      rateLimitStore.delete(key);
    }
  });

  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier);
  if (!entry) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(identifier, entry);
  }

  // Increment count
  entry.count++;

  // Check if rate limit exceeded
  if (entry.count > limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetTime };
  }

  return { success: true, limit, remaining: limit - entry.count, reset: entry.resetTime };
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const isAuthorized = !!req.auth;
  const userPermissions = (req.auth?.user?.permissions as string[]) || [];

  // Rate limiting for all requests
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = getRateLimit(clientIP, 200, 60 * 1000); // 200 requests per minute per IP

  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests', 
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000) 
      }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      }
    );
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isStripeWebhook = nextUrl.pathname.startsWith("/api/stripe/webhooks");
  const isLogoutRedirect =
    nextUrl.pathname === "/login" &&
    nextUrl.searchParams.get("callbackUrl")?.includes("/login");

  // Allow Stripe webhooks without authentication
  if (isStripeWebhook) {
    return response;
  }

  // Allow auth API routes without authentication
  if (isApiAuthRoute) {
    return response;
  }

  // Allow public routes without authentication
  if (isPublicRoute) {
    return response;
  }

  // Handle auth routes
  if (isAuthRoute) {
    if (isAuthorized) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return response;
  }

  // Check permissions for protected routes
  if (isAuthorized) {
    const matchingRoute = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
      nextUrl.pathname.startsWith(route)
    );

    if (matchingRoute) {
      const requiredPermissions = matchingRoute[1];
      const hasRequiredPermission = requiredPermissions.some((permissionValue) =>
        userPermissions.includes(permissionValue)
      );

      if (!hasRequiredPermission) {
        // Redirect to home page for unauthorized access TODO: Make an unauthorized page for better UX
        return Response.redirect(new URL("/", nextUrl));
      }
    }
  }

  if (!isAuthorized && !isPublicRoute) {
    // If this is a logout redirect, send to home page
    if (isLogoutRedirect) {
      return Response.redirect(new URL("/", nextUrl));
    }

    let callbackUrl = nextUrl.pathname;

    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    // Redirect to login page with callback URL
    return Response.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  return response;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};