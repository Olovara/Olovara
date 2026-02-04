"use client";

import { useEffect } from "react";
import { useShopTracking } from "@/hooks/use-analytics-tracking";

/**
 * Tracks a shop page view when mounted. Renders nothing.
 * Use on the shop page so analytics can record which shops are viewed and by whom.
 */
interface ShopViewTrackerProps {
  sellerId: string;
  sourceType?: string;
  sourceId?: string;
}

export function ShopViewTracker({
  sellerId,
  sourceType,
  sourceId,
}: ShopViewTrackerProps) {
  const { trackShopView } = useShopTracking(sellerId, sourceType, sourceId);

  useEffect(() => {
    trackShopView();
  }, [trackShopView]);

  return null;
}
