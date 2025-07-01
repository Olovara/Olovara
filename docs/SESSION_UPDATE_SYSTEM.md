# Automatic Session Refresh System

This document explains the automatic session refresh system that ensures users see updated permissions and onboarding status immediately when changes occur.

## Overview

The system provides real-time session updates through a combination of:
- **Server-side session updates** when permissions/onboarding status changes
- **WebSocket notifications** for instant client-side updates
- **Client-side hooks** for manual session refresh
- **API routes** for triggering updates from the client

## Architecture

### 1. Server-Side Components

#### `lib/session-utils.ts`
Utility functions for triggering complete session updates:

```typescript
// Triggers session update + WebSocket notification
await triggerCompleteSessionUpdate(userId, updatedBy, reason);

// For current user updates
await triggerCurrentUserSessionUpdate(reason);
```

#### `lib/session-update.ts`
Core session update functionality:

```typescript
// Updates user's session data to trigger JWT refresh
await updateUserSession(userId);
```

### 2. Client-Side Components

#### `hooks/use-session-update.ts`
React hook for client-side session updates:

```typescript
const { triggerSessionUpdate, forceSessionRefresh } = useSessionUpdate();

// Trigger server-side update + client refresh
await triggerSessionUpdate("Custom reason");

// Force immediate client refresh
await forceSessionRefresh();
```

#### `components/SessionUpdateListener.tsx`
WebSocket listener for real-time updates:

```typescript
// Automatically listens for session updates and refreshes
<SessionUpdateListener />
```

### 3. API Routes

#### `/api/auth/trigger-session-update`
Client-triggered session updates:

```typescript
POST /api/auth/trigger-session-update
{
  "reason": "Onboarding task completed"
}
```

#### `/api/socket/session-update`
WebSocket notification endpoint:

```typescript
POST /api/socket/session-update
{
  "userId": "user_id",
  "updatedBy": "admin_id", 
  "reason": "Application approved"
}
```

## Integration Points

### 1. Seller Onboarding Actions

All onboarding completion actions automatically trigger session updates:

```typescript
// actions/sellerOnboardingActions.ts
export async function markShopProfileComplete() {
  // ... update database
  
  // Trigger complete session update
  await triggerCompleteSessionUpdate(userId, userId, 'Shop profile completed');
  
  return { success: true };
}
```

### 2. Admin Approval Actions

Admin actions trigger session updates for affected users:

```typescript
// actions/adminActions.ts
export async function approveApplication(applicationId: string) {
  // ... approve application and update permissions
  
  // Trigger session update for the seller
  await triggerCompleteSessionUpdate(userId, currentUserData.id, 'Seller application approved');
  
  return { success: true };
}
```

### 3. Stripe Webhooks

Stripe connection status updates trigger session refresh:

```typescript
// app/api/stripe/connect/route.ts
case "account.updated": {
  // ... update seller status
  
  // Update user session
  await updateUserSession(seller.userId);
}
```

### 4. Client Components

Components can manually trigger updates:

```typescript
// components/seller/SellerOnboardingDashboard.tsx
const { forceSessionRefresh } = useSessionUpdate();

<Button onClick={() => forceSessionRefresh()}>
  Refresh Status
</Button>
```

## Usage Examples

### Server Actions

```typescript
import { triggerCompleteSessionUpdate } from "@/lib/session-utils";

export async function completeOnboardingTask() {
  // 1. Update database
  await db.seller.update({
    where: { userId },
    data: { shopProfileComplete: true }
  });

  // 2. Trigger session update
  await triggerCompleteSessionUpdate(userId, userId, 'Shop profile completed');

  return { success: true };
}
```

### Client Components

```typescript
import { useSessionUpdate } from "@/hooks/use-session-update";

export function MyComponent() {
  const { triggerSessionUpdate } = useSessionUpdate();

  const handleTaskComplete = async () => {
    // 1. Call server action
    await completeOnboardingTask();
    
    // 2. Trigger client-side update
    await triggerSessionUpdate("Task completed");
  };

  return <Button onClick={handleTaskComplete}>Complete Task</Button>;
}
```

### Layout Integration

```typescript
// app/layout.tsx
import { SessionUpdateListener } from "@/components/SessionUpdateListener";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SessionUpdateListener />
      </body>
    </html>
  );
}
```

## Benefits

1. **Real-time Updates**: Users see permission changes immediately without page refresh
2. **Consistent State**: Session data stays synchronized between server and client
3. **Better UX**: No manual refresh required after completing onboarding tasks
4. **Reliable**: Multiple fallback mechanisms ensure updates are delivered
5. **Scalable**: WebSocket system handles multiple concurrent users

## Error Handling

The system includes comprehensive error handling:

- WebSocket failures don't break server actions
- Client-side fallbacks to page refresh
- Graceful degradation when services are unavailable
- Detailed logging for debugging

## Monitoring

Monitor the system through:

- WebSocket connection logs
- Session update API response times
- Client-side error tracking
- Server action completion rates

## Future Enhancements

- Batch session updates for multiple users
- Priority queuing for critical updates
- Analytics on update frequency and success rates
- A/B testing for different update strategies 