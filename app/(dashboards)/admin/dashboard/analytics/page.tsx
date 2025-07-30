import { MarketplaceAnalyticsDashboard } from '@/components/analytics/MarketplaceAnalyticsDashboard';
import PermissionGate from '@/components/auth/permission-gate';
import { PERMISSIONS } from '@/data/roles-and-permissions';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <PermissionGate requiredPermission="VIEW_ANALYTICS">
        <MarketplaceAnalyticsDashboard />
      </PermissionGate>
    </div>
  );
} 