import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60 * 1000
) {
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
  
  // If entry exists but window has expired, reset it
  if (entry && entry.resetTime < now) {
    // Window expired, reset the counter
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(identifier, entry);
  } else if (!entry) {
    // No entry exists, create new one
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(identifier, entry);
  }

  // Increment count
  entry.count++;

  // Check if rate limit exceeded
  if (entry.count > limit) {
    // Ensure reset time is in the future
    const resetTime = entry.resetTime > now ? entry.resetTime : now + windowMs;
    return { success: false, limit, remaining: 0, reset: resetTime };
  }

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  };
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const isAuthorized = !!req.auth;

  // Check route types before rate limiting
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isStripeWebhook = nextUrl.pathname.startsWith("/api/stripe/webhooks");
  const isPermissionsApi = nextUrl.pathname === "/api/auth/permissions";
  const isClearCacheApi = nextUrl.pathname === "/api/auth/clear-cache";

  // Skip rate limiting for auth routes, API auth routes, and critical APIs
  // These routes are hit frequently during login/authentication flow
  const shouldSkipRateLimit = 
    isApiAuthRoute || 
    isAuthRoute || 
    isStripeWebhook || 
    isPermissionsApi || 
    isClearCacheApi;

  // Rate limiting for all other requests
  if (!shouldSkipRateLimit) {
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    
    // Higher limit for authenticated users (they're less likely to be bots)
    const rateLimit = isAuthorized ? 300 : 200;
    const rateLimitResult = getRateLimit(clientIP, rateLimit, 60 * 1000);

    if (!rateLimitResult.success) {
      // Calculate retryAfter, ensuring it's never negative
      const retryAfter = Math.max(0, Math.ceil((rateLimitResult.reset - Date.now()) / 1000));
      
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  const isLogoutRedirect =
    nextUrl.pathname === "/login" &&
    nextUrl.searchParams.get("callbackUrl")?.includes("/login");

  // Check if this is a dashboard route (protected route)
  const isDashboardRoute =
    nextUrl.pathname.startsWith("/seller/dashboard") ||
    nextUrl.pathname.startsWith("/admin/dashboard") ||
    nextUrl.pathname.startsWith("/member/dashboard");

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
    if (isAuthorized && req.auth?.user?.id) {
      // If user is already authenticated, redirect to their role-based dashboard
      // Fetch role from database to determine correct redirect
      try {
        const { db } = await import("@/lib/db");
        const dbUser = await db.user.findUnique({
          where: { id: req.auth.user.id },
          select: { 
            role: true,
            seller: {
              select: { id: true, applicationAccepted: true }
            }
          }
        });

        // Redirect based on role
        if (dbUser?.role === "SELLER" || dbUser?.seller) {
          return Response.redirect(new URL("/seller/dashboard", nextUrl));
        } else if (dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        } else if (dbUser?.role === "MEMBER") {
          return Response.redirect(new URL("/member/dashboard", nextUrl));
        }
      } catch (error) {
        console.error("Error fetching user role in middleware:", error);
        // Fall back to default redirect if there's an error
      }
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return response;
  }

  // For dashboard routes, be more lenient - let the client-side handle auth checks
  // This prevents race conditions where session cookie hasn't propagated yet
  // SECURITY: Server-side pages will still validate auth, this just prevents redirect loops
  if (isDashboardRoute && !isAuthorized) {
    // Only check for VALID NextAuth session cookies (not just any cookie)
    // This is safer than checking for any cookie with "session" in the name
    const hasValidSessionCookie =
      req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value ||
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value;

    // If there's a valid session cookie (even if not yet validated by auth()),
    // allow through - server-side page will validate and redirect if needed
    // This prevents the redirect loop when session is being established after login
    // IMPORTANT: Server-side pages MUST validate auth - this is just a timing fix
    if (hasValidSessionCookie) {
      return response;
    }

    // If no valid session cookie at all, redirect to login
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // For all other routes, just check if user is authenticated
  // Authorization (permission checks) will be handled by components and API routes
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
