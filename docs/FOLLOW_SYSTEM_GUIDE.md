# Seller Follow System Guide

This guide explains how to use the seller follow system in Yarnnu. The system allows users to follow their favorite sellers and see their latest products in a personalized feed.

## 🏗️ Architecture Overview

### Database Schema
- **Follow Model**: Stores follow relationships between users and sellers
- **Seller Model**: Includes denormalized `followerCount` for performance
- **User Model**: Has relation to followed sellers

### Key Features
- ✅ Real-time follow/unfollow with optimistic updates
- ✅ Denormalized follower count for fast queries
- ✅ Product feed from followed sellers
- ✅ Scalable design for thousands of followers
- ✅ Transaction-based updates for data consistency

## 🚀 Quick Start

### 1. Basic Follow Button

```tsx
import FollowButton from "@/components/FollowButton";

// Simple follow button
<FollowButton 
  sellerId="seller_id_here"
  sellerName="Shop Name"
/>

// With follower count display
<FollowButton 
  sellerId="seller_id_here"
  sellerName="Shop Name"
  showCount={true}
  initialFollowerCount={150}
/>
```

### 2. Product Feed from Followed Sellers

```tsx
import FollowedSellersFeed from "@/components/FollowedSellersFeed";

// Display products from followed sellers
<FollowedSellersFeed limit={12} />

// Without empty state
<FollowedSellersFeed 
  limit={8} 
  showEmptyState={false} 
/>
```

### 3. Followed Sellers List

```tsx
import FollowedSellersList from "@/components/FollowedSellersList";

// Display list of followed sellers
<FollowedSellersList />

// Without empty state
<FollowedSellersList showEmptyState={false} />
```

## 🔧 Server Actions

### Follow a Seller
```tsx
import { followSeller } from "@/actions/followActions";

const result = await followSeller(sellerId);
if (result.success) {
  console.log(result.message); // "You are now following Shop Name"
  console.log(result.followerCount); // Updated count
}
```

### Unfollow a Seller
```tsx
import { unfollowSeller } from "@/actions/followActions";

const result = await unfollowSeller(sellerId);
if (result.success) {
  console.log(result.message); // "You have unfollowed Shop Name"
}
```

### Check Follow Status
```tsx
import { isFollowingSeller } from "@/actions/followActions";

const isFollowing = await isFollowingSeller(sellerId);
// Returns true/false
```

### Get Followed Sellers Feed
```tsx
import { getFollowedSellersFeed } from "@/actions/followActions";

const products = await getFollowedSellersFeed(20);
// Returns array of products from followed sellers
```

## 🎣 Custom Hooks

### useFollow Hook
```tsx
import { useFollow } from "@/hooks/useFollow";

function MyComponent({ sellerId }) {
  const { 
    isFollowing, 
    followerCount, 
    isLoading, 
    toggleFollow 
  } = useFollow(sellerId, 150);

  return (
    <button 
      onClick={toggleFollow}
      disabled={isLoading}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
```

### useMultipleFollows Hook
```tsx
import { useMultipleFollows } from "@/hooks/useFollow";

function ProductGrid({ products }) {
  const sellerIds = products.map(p => p.sellerId);
  const { followStates, isLoading } = useMultipleFollows(sellerIds);

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <span>{product.name}</span>
          <span>
            {followStates[product.sellerId] ? "Following" : "Follow"}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## 📱 Integration Examples

### 1. Product Card with Follow Button

```tsx
// Add to existing ProductCard component
import FollowButton from "@/components/FollowButton";

const ProductCard = ({ product }) => {
  return (
    <div className="relative">
      {/* Existing product content */}
      
      {/* Follow button overlay */}
      {product.seller && (
        <div className="absolute top-2 right-2 z-10">
          <FollowButton
            sellerId={product.seller.id}
            sellerName={product.seller.shopName}
            variant="ghost"
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
          />
        </div>
      )}
    </div>
  );
};
```

### 2. Seller Profile Page

```tsx
// Seller profile with follow button and stats
import FollowButton from "@/components/FollowButton";
import { getSellerFollowerCount } from "@/actions/followActions";

const SellerProfile = async ({ seller }) => {
  const followerCount = await getSellerFollowerCount(seller.id);

  return (
    <div className="seller-profile">
      <div className="flex items-center justify-between">
        <div>
          <h1>{seller.shopName}</h1>
          <p>{seller.shopTagLine}</p>
        </div>
        <FollowButton
          sellerId={seller.id}
          sellerName={seller.shopName}
          showCount={true}
          initialFollowerCount={followerCount}
        />
      </div>
      
      <div className="stats">
        <span>{followerCount} followers</span>
        <span>{seller.totalProducts} products</span>
      </div>
    </div>
  );
};
```

### 3. Home Page with Followed Feed

```tsx
// Home page with followed sellers feed
import FollowedSellersFeed from "@/components/FollowedSellersFeed";

const HomePage = () => {
  return (
    <div>
      <section>
        <h2>From Your Followed Sellers</h2>
        <FollowedSellersFeed limit={8} />
      </section>
      
      <section>
        <h2>Discover New Products</h2>
        {/* Regular product grid */}
      </section>
    </div>
  );
};
```

### 4. User Dashboard

```tsx
// User dashboard with followed sellers
import FollowedSellersList from "@/components/FollowedSellersList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const UserDashboard = () => {
  return (
    <Tabs defaultValue="feed">
      <TabsList>
        <TabsTrigger value="feed">Product Feed</TabsTrigger>
        <TabsTrigger value="sellers">Followed Sellers</TabsTrigger>
      </TabsList>
      
      <TabsContent value="feed">
        <FollowedSellersFeed />
      </TabsContent>
      
      <TabsContent value="sellers">
        <FollowedSellersList />
      </TabsContent>
    </Tabs>
  );
};
```

## 🎨 Styling Customization

### FollowButton Variants
```tsx
// Different button styles
<FollowButton variant="default" size="lg" />
<FollowButton variant="outline" size="default" />
<FollowButton variant="ghost" size="sm" />

// Custom styling
<FollowButton 
  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
/>
```

### Feed Layout Customization
```tsx
// Custom grid layout
<FollowedSellersFeed 
  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
/>

// Custom list layout
<FollowedSellersList 
  className="space-y-6 max-w-2xl" 
/>
```

## 🔒 Security & Performance

### Security Features
- ✅ User authentication required for all follow operations
- ✅ Server-side validation of seller existence
- ✅ Prevention of duplicate follows
- ✅ Transaction-based updates for data consistency

### Performance Optimizations
- ✅ Denormalized follower count (O(1) reads)
- ✅ Indexed database queries
- ✅ Optimistic UI updates
- ✅ Efficient pagination for feeds

### Database Indexes
```sql
-- Fast lookups for seller's followers
CREATE INDEX Follow_sellerId_idx ON Follow(sellerId);

-- Fast lookups for user's following
CREATE INDEX Follow_followerId_idx ON Follow(followerId);

-- Chronological ordering
CREATE INDEX Follow_createdAt_idx ON Follow(createdAt);

-- Prevent duplicate follows
CREATE UNIQUE INDEX Follow_followerId_sellerId_key ON Follow(followerId, sellerId);
```

## 🚨 Error Handling

### Common Error Scenarios
```tsx
// Handle follow errors
const result = await followSeller(sellerId);
if (!result.success) {
  // Handle specific errors
  switch (result.error) {
    case "You must be logged in to follow sellers":
      // Redirect to login
      break;
    case "Seller not found":
      // Show error message
      break;
    case "You are already following this seller":
      // Update UI state
      break;
  }
}
```

### Loading States
```tsx
// Component loading states
const { isLoading, isInitialized } = useFollow(sellerId);

if (!isInitialized) {
  return <Skeleton className="w-24 h-10" />;
}

if (isLoading) {
  return <Button disabled>Loading...</Button>;
}
```

## 🔮 Future Enhancements

### Planned Features
- 📧 Email notifications for new products from followed sellers
- 🔔 Push notifications for product drops
- 📊 Analytics dashboard for sellers (follower insights)
- 🤖 AI-powered seller recommendations
- 📱 Mobile app integration

### Extension Points
- Custom notification preferences
- Follow categories/tags
- Follow expiration dates
- Follow analytics and insights

## 🧪 Testing

### Unit Tests
```tsx
// Test follow functionality
describe('Follow System', () => {
  it('should follow a seller', async () => {
    const result = await followSeller(sellerId);
    expect(result.success).toBe(true);
  });
  
  it('should prevent duplicate follows', async () => {
    await followSeller(sellerId);
    const result = await followSeller(sellerId);
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests
```tsx
// Test complete follow flow
describe('Follow Flow', () => {
  it('should update UI optimistically', async () => {
    render(<FollowButton sellerId={sellerId} />);
    fireEvent.click(screen.getByText('Follow'));
    expect(screen.getByText('Following')).toBeInTheDocument();
  });
});
```

## 📚 API Reference

### FollowButton Props
```tsx
interface FollowButtonProps {
  sellerId: string;                    // Required: Seller ID
  sellerName: string;                  // Required: Seller name for messages
  initialFollowerCount?: number;       // Optional: Initial follower count
  variant?: "default" | "outline" | "ghost";  // Optional: Button variant
  size?: "default" | "sm" | "lg";     // Optional: Button size
  showCount?: boolean;                 // Optional: Show follower count
  className?: string;                  // Optional: Custom CSS classes
}
```

### Server Action Returns
```tsx
interface FollowResult {
  success: boolean;
  message?: string;
  error?: string;
  followerCount?: number;
}
```

---

This follow system is designed to be scalable, performant, and user-friendly. It provides a solid foundation for building social features in your marketplace while maintaining excellent performance even with thousands of followers per seller.

