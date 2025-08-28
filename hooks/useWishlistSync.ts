"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface WishlistSyncState {
  // Track which products are in wishlists
  wishlistItems: Set<string>;
  // Track total items count for navbar badge
  totalItems: number;
  // Loading states for individual products
  loadingStates: Record<string, boolean>;
  // Track if we're in the middle of an optimistic update
  isUpdating: boolean;
  
  // Actions
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  setWishlistItems: (productIds: string[]) => void;
  setLoadingState: (productId: string, loading: boolean) => void;
  setTotalItems: (count: number) => void;
  reset: () => void;
  setIsUpdating: (updating: boolean) => void;
}

export const useWishlistSync = create<WishlistSyncState>()(
  subscribeWithSelector((set, get) => ({
    wishlistItems: new Set(),
    totalItems: 0,
    loadingStates: {},
    isUpdating: false,

    addToWishlist: (productId: string) => {
      set((state) => {
        // Prevent duplicate updates
        if (state.wishlistItems.has(productId)) {
          return state;
        }
        
        const newWishlistItems = new Set(state.wishlistItems);
        newWishlistItems.add(productId);
        return {
          wishlistItems: newWishlistItems,
          totalItems: state.totalItems + 1,
        };
      });
    },

    removeFromWishlist: (productId: string) => {
      set((state) => {
        // Prevent duplicate updates
        if (!state.wishlistItems.has(productId)) {
          return state;
        }
        
        const newWishlistItems = new Set(state.wishlistItems);
        newWishlistItems.delete(productId);
        return {
          wishlistItems: newWishlistItems,
          totalItems: Math.max(0, state.totalItems - 1),
        };
      });
    },

    setWishlistItems: (productIds: string[]) => {
      set({
        wishlistItems: new Set(productIds),
        totalItems: productIds.length,
      });
    },

    setLoadingState: (productId: string, loading: boolean) => {
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [productId]: loading,
        },
      }));
    },

    setTotalItems: (count: number) => {
      set({ totalItems: count });
    },

    setIsUpdating: (updating: boolean) => {
      set({ isUpdating: updating });
    },

    reset: () => {
      set({
        wishlistItems: new Set(),
        totalItems: 0,
        loadingStates: {},
        isUpdating: false,
      });
    },
  }))
);

// Helper hook to check if a product is in wishlist
export const useIsInWishlist = (productId: string) => {
  return useWishlistSync((state) => state.wishlistItems.has(productId));
};

// Helper hook to get loading state for a product
export const useWishlistLoading = (productId: string) => {
  return useWishlistSync((state) => state.loadingStates[productId] || false);
};

// Helper hook to get total items count
export const useWishlistTotalItems = () => {
  return useWishlistSync((state) => state.totalItems);
};

// Helper hook to get all wishlist items
export const useWishlistItems = () => {
  return useWishlistSync((state) => Array.from(state.wishlistItems));
};
