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
  const userPermissions = (req.auth?.user?.permissions as string[]) || [];

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
        // You can redirect to an "unauthorized" page or just return a 403
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};