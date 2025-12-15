# QA Mode Usage Guide

## What is QA Mode?

QA mode is **full behavioral telemetry** for a small, controlled group of users. It's not "more error logs" - it tracks what users do, even when nothing crashes.

### Key Differences

**Error Logs:**
- Only on failure
- Technical details
- Stack traces
- "Something broke"

**QA Logs:**
- Success + failure
- Behavioral tracking
- Step-based
- "What the user tried to do"

## Setup

1. **Enable QA mode for a user** (admin only):
   - Go to `/admin/dashboard/qa`
   - Or go to `/admin/dashboard/users` and toggle QA mode

2. **Session ID tracking** (automatic):
   - Session IDs are generated client-side and stored in localStorage
   - They persist across page reloads
   - Use `getQaSessionId()` from `lib/qa-session.ts`

## Usage Examples

### Product Creation Flow

```typescript
import { logQaStep } from "@/lib/qa-logger";
import { PRODUCT_STEPS, QA_EVENTS } from "@/lib/qa-steps";
import { getQaSessionId } from "@/lib/qa-session";

// User enters product form
logQaStep({
  userId: user.id,
  sessionId: getQaSessionId(),
  event: QA_EVENTS.PRODUCT_CREATE,
  step: PRODUCT_STEPS.DETAILS,
  status: "started",
  route: "/sell/new",
});

// User completes images step
logQaStep({
  userId: user.id,
  sessionId: getQaSessionId(),
  event: QA_EVENTS.PRODUCT_CREATE,
  step: PRODUCT_STEPS.IMAGES,
  status: "completed",
  route: "/sell/new",
  metadata: {
    imageCount: 5,
    totalSize: 1024000,
  },
});

// API call fails
logQaStep({
  userId: user.id,
  sessionId: getQaSessionId(),
  event: QA_EVENTS.PRODUCT_CREATE,
  step: PRODUCT_STEPS.SUBMIT,
  status: "failed",
  route: "/api/products/create-product",
  metadata: {
    errorCode: "UPLOAD_TIMEOUT",
    fileSize: 18432000,
  },
});
```

### Checkout Flow

```typescript
import { logQaStep } from "@/lib/qa-logger";
import { CHECKOUT_STEPS, QA_EVENTS } from "@/lib/qa-steps";
import { getQaSessionId } from "@/lib/qa-session";

// User enters checkout
logQaStep({
  userId: user.id,
  sessionId: getQaSessionId(),
  event: QA_EVENTS.CHECKOUT,
  step: CHECKOUT_STEPS.CART,
  status: "started",
  route: "/checkout",
});

// User completes shipping
logQaStep({
  userId: user.id,
  sessionId: getQaSessionId(),
  event: QA_EVENTS.CHECKOUT,
  step: CHECKOUT_STEPS.SHIPPING,
  status: "completed",
  route: "/checkout",
  metadata: {
    country: "US",
    hasCustomAddress: true,
  },
});
```

### Server-Side API Routes

```typescript
import { logQaEvent } from "@/lib/qa-logger";
import { QA_EVENTS } from "@/lib/qa-steps";

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  
  // Get session ID from request headers (client should send it)
  const sessionId = req.headers.get("x-qa-session-id") || "";

  try {
    // Your logic here
    const result = await createProduct(body);
    
    // Log success
    logQaEvent({
      userId: session.user.id,
      sessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: "submit",
      status: "completed",
      route: "/api/products/create-product",
      metadata: {
        productId: result.id,
        isDigital: body.isDigital,
      },
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // Log failure
    logQaEvent({
      userId: session.user.id,
      sessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: "submit",
      status: "failed",
      route: "/api/products/create-product",
      metadata: {
        error: error.message,
        payload: body,
      },
    });
    
    throw error;
  }
}
```

### Client-Side Components

```typescript
"use client";

import { logQaStep } from "@/lib/qa-logger";
import { getQaSessionId } from "@/lib/qa-session";
import { PRODUCT_STEPS, QA_EVENTS } from "@/lib/qa-steps";
import { useCurrentUser } from "@/hooks/use-current-user";

export function ProductForm() {
  const user = useCurrentUser();
  
  const handleStepChange = (step: string) => {
    if (!user?.id) return;
    
    logQaStep({
      userId: user.id,
      sessionId: getQaSessionId(),
      event: QA_EVENTS.PRODUCT_CREATE,
      step,
      status: "started",
      route: window.location.pathname,
    });
  };
  
  // ... rest of component
}
```

## Best Practices

1. **Only log meaningful events** - Don't log every keystroke
2. **Use step constants** - Import from `lib/qa-steps.ts` for consistency
3. **Include metadata** - Add context like file sizes, error codes, etc.
4. **Never block requests** - QA logging is fire-and-forget
5. **Keep QA mode small** - 10-30 users max

## Viewing QA Events

1. Go to `/admin/dashboard/qa`
2. View recent events, filter by user, or replay sessions
3. Events are grouped by session ID for easy replay

## Session Replay

To replay a user's flow:
1. Find a session ID in the events
2. Use `getQaEventsBySession(sessionId)` to get all events in order
3. Events are sorted chronologically to show the exact path

## Important Notes

- QA logs expire after 30 days (you may want to add cleanup)
- QA logging never blocks requests - failures are silent
- Only users with `isQaUser = true` generate events
- Session IDs persist in localStorage until cleared
