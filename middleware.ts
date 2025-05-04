import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  adminRoutes,
  sellerRoutes,
  memberRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthorized = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isStripeWebhook = nextUrl.pathname.startsWith('/api/stripe/webhooks');
  const isLogoutRedirect = nextUrl.pathname === '/login' && nextUrl.searchParams.get('callbackUrl')?.includes('/login');

  // Check role-based access
  const isAdminRoute = adminRoutes.some((route: string) => nextUrl.pathname.startsWith(route));
  const isSellerRoute = sellerRoutes.some((route: string) => nextUrl.pathname.startsWith(route)) && !nextUrl.pathname.startsWith('/seller-application');
  const isMemberRoute = memberRoutes.some((route: string) => nextUrl.pathname.startsWith(route));

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

  // Role-based access control
  if (isAuthorized) {
    if (isAdminRoute && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (isSellerRoute && userRole !== 'SELLER') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (isMemberRoute && userRole !== 'MEMBER') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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