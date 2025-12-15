# Error Logging System Documentation

## Overview

The Error Logging System is a **bulletproof** error tracking solution that logs errors to both console and database without ever breaking your application. It's designed to eliminate silent failures and provide comprehensive error tracking across all critical user paths.

### Key Features

- **Bulletproof Design**: Never throws errors, never breaks your app
- **Dual Logging**: Logs to console (synchronous) and database (fire-and-forget)
- **User-Friendly Messages**: Returns actionable error messages for users
- **Comprehensive Coverage**: Tracks errors across API routes, server actions, and client-side code
- **Rich Metadata**: Captures context, stack traces, and custom metadata
- **Timeout Protection**: 2-second timeout prevents slow DB writes from piling up

## Architecture

### Design Principles

1. **Console Logging Always Happens First** (synchronous)
   - Ensures errors are always visible in logs, even if database is down
   - Uses appropriate log levels (error, warn, info)

2. **Database Logging is Fire-and-Forget** (asynchronous)
   - Never awaited, never throws
   - Uses Promise.race with 2-second timeout
   - Database failures are logged to console but don't break requests

3. **User-Friendly Messages**
   - Every error code has a corresponding user-friendly message
   - Messages guide users on what to do next
   - Generic fallback message if code not found

### Error Flow

```
Error Occurs
    ↓
logError() called
    ↓
1. Console log (synchronous) ✅ Always happens
    ↓
2. Database write (fire-and-forget) ⚡ Non-blocking
    ↓
3. Return user message ✅ Immediate response
```

## Database Schema

The `ErrorLog` model stores all logged errors:

```prisma
model ErrorLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  level     String   // "info" | "warn" | "error" | "fatal"
  code      String   // Error code like "PRODUCT_CREATE_FAILED"
  message   String   // Error message
  userId    String?  // Optional user ID
  route     String?  // API route or page path
  method    String?  // HTTP method
  metadata  Json?    // Additional context
  error     Json?    // Error details (name, message, stack)
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([code])
  @@index([createdAt])
  @@index([level])
}
```

## Usage

### Basic Usage in API Routes

```typescript
import { logError } from "@/lib/error-logger";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    body = await req.json();
    
    // Your logic here
    await createProduct(body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating product:", error);
    
    // Don't log expected errors (validation, auth, etc.)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }
    
    // Log to database - user could email about "couldn't create product"
    const userMessage = logError({
      code: "PRODUCT_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/products/create-product",
      method: "POST",
      error,
      metadata: {
        productName: body?.name,
        isDigital: body?.isDigital,
        note: "Failed to create product",
      },
    });
    
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}
```

### Usage in Server Actions

```typescript
"use server";

import { logError } from "@/lib/error-logger";
import { auth } from "@/auth";

export async function updateUserProfile(data: ProfileData) {
  // Declare variables outside try block
  let session: any = null;

  try {
    session = await auth();
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }
    
    // Your logic here
    await db.user.update({
      where: { id: session.user.id },
      data,
    });
    
    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating profile:", error);
    
    // Don't log authentication errors - they're expected
    if (error instanceof Error && error.message.includes("Not authenticated")) {
      return { error: error.message };
    }
    
    // Log to database
    const userMessage = logError({
      code: "USER_PROFILE_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "actions/updateUserProfile",
      method: "updateUserProfile",
      error,
      metadata: {
        note: "Failed to update user profile",
      },
    });
    
    return { error: userMessage };
  }
}
```

### Client-Side Error Logging

For client-side errors, use the `/api/error-log` endpoint:

```typescript
// In a client component
"use client";

async function handleError(error: Error) {
  try {
    await fetch("/api/error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "CLIENT_SIDE_ERROR",
        error: {
          message: error.message,
          stack: error.stack,
        },
        route: window.location.pathname,
        method: "CLIENT",
        metadata: {
          userAgent: navigator.userAgent,
          note: "Client-side error occurred",
        },
      }),
    });
  } catch (logError) {
    // Even logging failures shouldn't break the app
    console.error("Failed to log error:", logError);
  }
}
```

### Using the Helper Wrapper

For functions that need automatic error logging:

```typescript
import { withErrorLogging } from "@/lib/error-logger";

export const createProduct = withErrorLogging(
  async (data: ProductData) => {
    // Product creation logic
    return await db.product.create({ data });
  },
  {
    code: "PRODUCT_CREATE_FAILED",
    getUserId: (data) => data.userId,
    getRoute: () => "/api/products/create-product",
    getMethod: () => "POST",
    getMetadata: (data) => ({
      productName: data.name,
      isDigital: data.isDigital,
    }),
  }
);
```

## Error Codes

Error codes follow a consistent naming pattern:

- `{MODULE}_{ACTION}_FAILED` - e.g., `PRODUCT_CREATE_FAILED`
- `{MODULE}_{ACTION}_FETCH_FAILED` - e.g., `USER_PROFILE_FETCH_FAILED`
- `{MODULE}_{ACTION}_UPDATE_FAILED` - e.g., `SELLER_PREFERENCES_UPDATE_FAILED`

### Adding New Error Codes

1. **Add the code to `logError()` call**:
```typescript
logError({
  code: "NEW_FEATURE_ACTION_FAILED",
  // ... other options
});
```

2. **Add user-friendly message to `userMessages` object**:
```typescript
const userMessages: Record<string, string> = {
  // ... existing messages
  NEW_FEATURE_ACTION_FAILED:
    "We couldn't complete that action. Please try again or contact support.",
};
```

## Best Practices

### ✅ DO

1. **Always declare variables outside try blocks** for catch block access:
```typescript
let session: any = null;
let body: any = null;

try {
  session = await auth();
  body = await req.json();
  // ...
} catch (error) {
  // session and body are accessible here
  logError({
    userId: session?.user?.id,
    metadata: { bodyData: body },
    // ...
  });
}
```

2. **Skip expected errors** (validation, authentication, permission):
```typescript
// Don't log Zod validation errors
if (error instanceof z.ZodError) {
  return NextResponse.json({ error: "Validation failed" }, { status: 400 });
}

// Don't log authentication errors
if (error instanceof Error && error.message.includes("Not authenticated")) {
  return { error: error.message };
}
```

3. **Include rich metadata** for debugging:
```typescript
logError({
  code: "PRODUCT_CREATE_FAILED",
  metadata: {
    productName: body?.name,
    productId: body?.id,
    sellerId: session?.user?.id,
    timestamp: new Date().toISOString(),
    note: "Failed during image upload step",
  },
});
```

4. **Use descriptive error codes**:
```typescript
// Good
code: "PRODUCT_IMAGE_UPLOAD_FAILED"

// Bad
code: "ERROR_123"
```

### ❌ DON'T

1. **Don't await `logError()`** - it's fire-and-forget:
```typescript
// ❌ Wrong
await logError({ ... });

// ✅ Correct
logError({ ... });
```

2. **Don't log expected errors** (validation, auth, not found):
```typescript
// ❌ Wrong - don't log validation errors
if (error instanceof z.ZodError) {
  logError({ code: "VALIDATION_ERROR", error });
}

// ✅ Correct - return early without logging
if (error instanceof z.ZodError) {
  return NextResponse.json({ error: "Validation failed" }, { status: 400 });
}
```

3. **Don't throw from `logError()`** - it never throws:
```typescript
// ❌ Wrong
logError({ ... });
throw error; // This is fine, but logError itself doesn't throw

// ✅ Correct
const userMessage = logError({ ... });
return { error: userMessage };
```

4. **Don't include sensitive data in metadata**:
```typescript
// ❌ Wrong
metadata: {
  password: userPassword, // Never log passwords!
  creditCard: cardNumber,  // Never log payment info!
}

// ✅ Correct
metadata: {
  userId: user.id,
  action: "password_reset",
  note: "Password reset failed",
}
```

## Error Levels

The system automatically determines error levels from error codes:

- **`error`**: Default level, used for `*_FAILED` or `*_ERROR` codes
- **`warn`**: Used for `*_WARN` or `*_WARNING` codes
- **`fatal`**: Used for `*_FATAL` or `*_CRITICAL` codes
- **`info`**: Used for `*_INFO` codes

```typescript
// Automatically set to "error" level
logError({ code: "PRODUCT_CREATE_FAILED", ... });

// Automatically set to "warn" level
logError({ code: "RATE_LIMIT_WARNING", ... });

// Automatically set to "fatal" level
logError({ code: "DATABASE_CONNECTION_CRITICAL", ... });
```

## Querying Error Logs

### In Admin Dashboard

Error logs can be queried from the database:

```typescript
// Get recent errors
const recentErrors = await db.errorLog.findMany({
  orderBy: { createdAt: "desc" },
  take: 50,
});

// Get errors for a specific user
const userErrors = await db.errorLog.findMany({
  where: { userId: "user123" },
  orderBy: { createdAt: "desc" },
});

// Get errors by code
const productErrors = await db.errorLog.findMany({
  where: { code: "PRODUCT_CREATE_FAILED" },
  orderBy: { createdAt: "desc" },
});

// Get errors in a date range
const todayErrors = await db.errorLog.findMany({
  where: {
    createdAt: {
      gte: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  },
});
```

## Common Patterns

### Pattern 1: API Route with Authentication

```typescript
export async function POST(req: NextRequest) {
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await req.json();
    // ... your logic
  } catch (error) {
    console.error("Error:", error);
    
    // Skip auth errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userMessage = logError({
      code: "YOUR_ERROR_CODE",
      userId: session?.user?.id,
      route: "/api/your-route",
      method: "POST",
      error,
      metadata: { note: "Failed to process request" },
    });
    
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
```

### Pattern 2: Server Action with Validation

```typescript
"use server";

export async function updateData(data: DataSchema) {
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Validate with Zod
    const validated = DataSchema.parse(data);
    
    // ... your logic
  } catch (error) {
    console.error("Error:", error);
    
    // Skip validation errors
    if (error instanceof z.ZodError) {
      return { error: "Invalid data" };
    }
    
    // Skip auth errors
    if (error instanceof Error && error.message.includes("Not authenticated")) {
      return { error: error.message };
    }
    
    const userMessage = logError({
      code: "DATA_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "actions/updateData",
      method: "updateData",
      error,
      metadata: { note: "Failed to update data" },
    });
    
    return { error: userMessage };
  }
}
```

### Pattern 3: Transaction with Error Logging

```typescript
try {
  await db.$transaction(async (tx) => {
    // Multiple operations
    await tx.product.create({ data: productData });
    await tx.inventory.update({ where: { id }, data: inventoryData });
  });
} catch (error) {
  console.error("Transaction failed:", error);
  
  const userMessage = logError({
    code: "TRANSACTION_FAILED",
    userId: session?.user?.id,
    route: "/api/products/create",
    method: "POST",
    error,
    metadata: {
      productName: productData.name,
      note: "Database transaction failed",
    },
  });
  
  return NextResponse.json({ error: userMessage }, { status: 500 });
}
```

## Troubleshooting

### Error logs not appearing in database

1. **Check console logs** - Console logging always happens, so check if errors are being caught
2. **Check database connection** - Database failures are logged to console with `[ERROR_LOG_DB_FAILED]`
3. **Check timeout** - Database writes have a 2-second timeout; very slow databases may timeout
4. **Check error code** - Ensure the error code exists in `userMessages` (not required, but recommended)

### Too many error logs

1. **Review error filtering** - Make sure you're not logging expected errors (validation, auth)
2. **Check error codes** - Ensure you're using specific error codes, not generic ones
3. **Review metadata** - Don't log on every validation failure, only unexpected errors

### User messages not showing

1. **Check error code** - Ensure the error code exists in `userMessages` object
2. **Check return value** - Make sure you're returning the message from `logError()`
3. **Check error handling** - Ensure errors are being caught and messages are returned

## Integration Checklist

When adding error logging to a new route/action:

- [ ] Import `logError` from `@/lib/error-logger`
- [ ] Declare variables outside try block (session, body, etc.)
- [ ] Add try-catch block around main logic
- [ ] Skip expected errors (validation, auth, not found)
- [ ] Call `logError()` with appropriate code
- [ ] Add error code to `userMessages` object in `error-logger.ts`
- [ ] Return user-friendly message to client
- [ ] Test error scenarios to ensure logging works

## Examples by Category

### Seller Onboarding
- `SELLER_APPLICATION_FAILED`
- `ONBOARDING_FETCH_FAILED`
- `ONBOARDING_STEP_UPDATE_FAILED`
- `SELLER_ONBOARDING_MARK_SHOP_NAMING_FAILED`

### Product Management
- `PRODUCT_CREATE_FAILED`
- `PRODUCT_UPDATE_FAILED`
- `PRODUCT_DUPLICATE_FAILED`
- `IMAGE_UPLOAD_FAILED`

### Checkout & Payments
- `CHECKOUT_FAILED`
- `PAYMENT_INTENT_FAILED`
- `ORDER_CREATE_FAILED`
- `STRIPE_PAYMENT_FAILED`

### Admin Actions
- `ADMIN_APPROVE_APPLICATION_FAILED`
- `ADMIN_REJECT_APPLICATION_FAILED`
- `ADMIN_GET_DASHBOARD_STATS_FAILED`

See `lib/error-logger.ts` for the complete list of error codes and messages.

## Summary

The Error Logging System provides:

✅ **Bulletproof error tracking** - Never breaks your app  
✅ **Dual logging** - Console + Database  
✅ **User-friendly messages** - Actionable error messages  
✅ **Rich context** - Metadata, stack traces, user info  
✅ **Easy integration** - Simple API, consistent patterns  

By following this documentation, you'll have comprehensive error tracking across your entire application, making it easier to identify and fix issues before users report them.
