# QA Mode Integration Example - Product Form

This guide shows you exactly how to add QA logging to your product form (and other flows).

## Quick Answer

**Yes, you need to manually add QA logging calls.** The QA system is opt-in and requires explicit logging at key points in your flows.

## Step 1: Add Imports to ProductForm.tsx

Add these imports at the top of your `ProductForm.tsx`:

```typescript
import { logQaStep } from "@/lib/qa-logger";
import { getQaSessionId } from "@/lib/qa-session";
import { PRODUCT_STEPS, QA_EVENTS } from "@/lib/qa-steps";
import { useCurrentUser } from "@/hooks/use-current-user";
```

## Step 2: Get User and Session ID

In your `ProductForm` component, get the user and session ID:

```typescript
export function ProductForm({ initialData }: ProductFormProps) {
  const user = useCurrentUser();
  const sessionId = getQaSessionId(); // Gets or creates session ID
  
  // ... rest of your component
}
```

## Step 3: Log When User Enters Form

When the form loads (or when user navigates to it):

```typescript
useEffect(() => {
  if (!user?.id) return;
  
  logQaStep({
    userId: user.id,
    sessionId,
    event: QA_EVENTS.PRODUCT_CREATE,
    step: PRODUCT_STEPS.DETAILS,
    status: "started",
    route: window.location.pathname,
  });
}, [user?.id, sessionId]);
```

## Step 4: Log Step Transitions

When user moves between sections (if you have a multi-step form):

```typescript
const handleStepChange = (newStep: string) => {
  if (!user?.id) return;
  
  // Log completion of previous step
  logQaStep({
    userId: user.id,
    sessionId,
    event: QA_EVENTS.PRODUCT_CREATE,
    step: PRODUCT_STEPS.DETAILS, // previous step
    status: "completed",
    route: window.location.pathname,
  });
  
  // Log start of new step
  logQaStep({
    userId: user.id,
    sessionId,
    event: QA_EVENTS.PRODUCT_CREATE,
    step: newStep,
    status: "started",
    route: window.location.pathname,
  });
};
```

## Step 5: Log Image Upload Step

When images are uploaded:

```typescript
// After successful image upload
logQaStep({
  userId: user.id,
  sessionId,
  event: QA_EVENTS.PRODUCT_CREATE,
  step: PRODUCT_STEPS.IMAGES,
  status: "completed",
  route: window.location.pathname,
  metadata: {
    imageCount: finalImageUrls.length,
    totalSize: totalImageSize,
  },
});
```

## Step 6: Log Form Submission

In your `onSubmit` function:

```typescript
const onSubmit = async (data: ProductFormValues) => {
  if (!user?.id) return;
  
  try {
    // Log that submission started
    logQaStep({
      userId: user.id,
      sessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: PRODUCT_STEPS.SUBMIT,
      status: "started",
      route: window.location.pathname,
      metadata: {
        isDraft: data.status === "DRAFT",
        isDigital: data.isDigital,
        hasImages: processedImages.length > 0,
      },
    });
    
    // ... your existing submission logic ...
    
    const response = await fetch(
      initialData
        ? `/api/products/${initialData.id}`
        : "/api/products/create-product",
      {
        method: initialData ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-qa-session-id": sessionId, // Send session ID to server
        },
        body: JSON.stringify(formData),
      }
    );
    
    if (response.ok) {
      // Log success
      logQaStep({
        userId: user.id,
        sessionId,
        event: QA_EVENTS.PRODUCT_CREATE,
        step: PRODUCT_STEPS.SUBMIT,
        status: "completed",
        route: window.location.pathname,
        metadata: {
          productId: responseData.product?.id,
          isDraft: data.status === "DRAFT",
        },
      });
    } else {
      // Log failure
      logQaStep({
        userId: user.id,
        sessionId,
        event: QA_EVENTS.PRODUCT_CREATE,
        step: PRODUCT_STEPS.SUBMIT,
        status: "failed",
        route: window.location.pathname,
        metadata: {
          errorCode: response.status,
          errorMessage: responseData.error,
        },
      });
    }
  } catch (error) {
    // Log error
    logQaStep({
      userId: user.id,
      sessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: PRODUCT_STEPS.SUBMIT,
      status: "failed",
      route: window.location.pathname,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    
    throw error;
  }
};
```

## Step 7: Add Server-Side Logging

In your API route (`/api/products/create-product/route.ts`):

```typescript
import { logQaEvent } from "@/lib/qa-logger";
import { QA_EVENTS, PRODUCT_STEPS } from "@/lib/qa-steps";

export async function POST(req: NextRequest) {
  const session = await auth();
  const sessionId = req.headers.get("x-qa-session-id") || ""; // Get from header
  
  try {
    // ... your existing logic ...
    
    // Log successful creation
    logQaEvent({
      userId: session.user.id,
      sessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: PRODUCT_STEPS.SUBMIT,
      status: "completed",
      route: "/api/products/create-product",
      metadata: {
        productId: product.id,
        isDigital: data.isDigital,
        imageCount: data.images?.length || 0,
      },
    });
    
    return NextResponse.json({ success: true, product });
  } catch (error) {
    // Log failure
    logQaEvent({
      userId: session.user.id,
      sessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: PRODUCT_STEPS.SUBMIT,
      status: "failed",
      route: "/api/products/create-product",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    
    throw error;
  }
}
```

## Complete Example: Minimal Integration

Here's the minimal code you need to add to get QA logging working:

### ProductForm.tsx (Client-Side)

```typescript
// Add imports
import { logQaStep } from "@/lib/qa-logger";
import { getQaSessionId } from "@/lib/qa-session";
import { PRODUCT_STEPS, QA_EVENTS } from "@/lib/qa-steps";
import { useCurrentUser } from "@/hooks/use-current-user";

export function ProductForm({ initialData }: ProductFormProps) {
  const user = useCurrentUser();
  const sessionId = getQaSessionId();
  
  // Log form entry
  useEffect(() => {
    if (!user?.id) return;
    logQaStep({
      userId: user.id,
      sessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: PRODUCT_STEPS.DETAILS,
      status: "started",
      route: window.location.pathname,
    });
  }, [user?.id, sessionId]);
  
  const onSubmit = async (data: ProductFormValues) => {
    if (!user?.id) return;
    
    try {
      // Log submission start
      logQaStep({
        userId: user.id,
        sessionId,
        event: QA_EVENTS.PRODUCT_CREATE,
        step: PRODUCT_STEPS.SUBMIT,
        status: "started",
        route: window.location.pathname,
      });
      
      const response = await fetch("/api/products/create-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-qa-session-id": sessionId, // Important: send session ID
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        logQaStep({
          userId: user.id,
          sessionId,
          event: QA_EVENTS.PRODUCT_CREATE,
          step: PRODUCT_STEPS.SUBMIT,
          status: "completed",
          route: window.location.pathname,
        });
      } else {
        logQaStep({
          userId: user.id,
          sessionId,
          event: QA_EVENTS.PRODUCT_CREATE,
          step: PRODUCT_STEPS.SUBMIT,
          status: "failed",
          route: window.location.pathname,
        });
      }
    } catch (error) {
      logQaStep({
        userId: user.id,
        sessionId,
        event: QA_EVENTS.PRODUCT_CREATE,
        step: PRODUCT_STEPS.SUBMIT,
        status: "failed",
        route: window.location.pathname,
      });
    }
  };
}
```

### API Route (Server-Side)

```typescript
import { logQaEvent } from "@/lib/qa-logger";
import { QA_EVENTS, PRODUCT_STEPS } from "@/lib/qa-steps";

export async function POST(req: NextRequest) {
  const session = await auth();
  const sessionId = req.headers.get("x-qa-session-id") || "";
  
  try {
    // ... create product ...
    
    logQaEvent({
      userId: session.user.id,
      sessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: PRODUCT_STEPS.SUBMIT,
      status: "completed",
      route: "/api/products/create-product",
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logQaEvent({
      userId: session.user.id,
      sessionId,
      event: QA_EVENTS.PRODUCT_CREATE,
      step: PRODUCT_STEPS.SUBMIT,
      status: "failed",
      route: "/api/products/create-product",
    });
    throw error;
  }
}
```

## Key Points

1. **Only logs for QA users** - The logger automatically checks if `user.isQaUser === true`
2. **Fire-and-forget** - Logging never blocks your requests
3. **Session ID required** - Send it from client to server via header
4. **Log meaningful steps** - Don't log every keystroke, just key transitions
5. **Include metadata** - Add context like file sizes, error codes, etc.

## Other Flows to Add QA Logging

- **Checkout flow**: Log cart → shipping → payment → complete
- **Seller onboarding**: Log each onboarding step
- **Custom orders**: Log form submission → payment → completion
- **Profile updates**: Log when user updates settings

See `docs/qa-mode-usage.md` for more examples.
