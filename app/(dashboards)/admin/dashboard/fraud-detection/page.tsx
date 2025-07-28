import { FraudDetectionDashboard } from '@/components/analytics/FraudDetectionDashboard';
import PermissionGate from '@/components/auth/permission-gate';
import { PERMISSIONS } from '@/data/roles-and-permissions';

export default function FraudDetectionPage() {
  return (
    <div className="container mx-auto py-6">
      <PermissionGate requiredPermission="VIEW_FRAUD_DETECTION">
        <FraudDetectionDashboard />
      </PermissionGate>
    </div>
  );
} 