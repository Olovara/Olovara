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

export default auth(async (req) => {
  const { nextUrl } = req;
  const isAuthorized = !!req.auth;
  const userId = req.auth?.user?.id;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isStripeWebhook = nextUrl.pathname.startsWith('/api/stripe/webhooks');
  const isLogoutRedirect = nextUrl.pathname === '/login' && nextUrl.searchParams.get('callbackUrl')?.includes('/login');

  // Allow Stripe webhooks without authentication
  if (isStripeWebhook) {
    return;
  }

  // Allow auth API routes without authentication
  if (isApiAuthRoute) {
    return;
  }

  // Allow public routes without authentication
  if (isPublicRoute) {
    return;
  }

  // Handle auth routes
  if (isAuthRoute) {
    if (isAuthorized) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  // Check permissions for protected routes
  if (isAuthorized && userId) {
    // Find matching route and its required permissions
    const matchingRoute = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
      nextUrl.pathname.startsWith(route)
    );

    if (matchingRoute) {
      const [_, requiredPermissions] = matchingRoute;

      try {
        // Check if user has any of the required permissions
        const response = await fetch(`${nextUrl.origin}/api/auth/check-permission?permission=${requiredPermissions[0]}`);
        if (!response.ok) {
          throw new Error('Failed to check permission');
        }
        const data = await response.json();
        
        if (!data.hasPermission) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } catch (error) {
        console.error("Error checking permission:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    }
  }

  if (!isAuthorized && !isPublicRoute) {
    // If this is a logout redirect, send to home page
    if (isLogoutRedirect) {
      return Response.redirect(new URL('/', nextUrl));
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

  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};