import PermissionGate from "@/components/auth/permission-gate";
import SellerPortfolioManager from "@/components/seller/SellerPortfolioManager";

export default function SellerPortfolioPage() {
  return (
    <PermissionGate requiredPermission="MANAGE_SELLER_SETTINGS">
      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Portfolio Gallery</h1>
            <p className="text-muted-foreground">
              Upload up to 24 custom creations to help buyers understand your
              style. Pin up to 4 to the top.
            </p>
          </div>
          <SellerPortfolioManager />
        </div>
      </div>
    </PermissionGate>
  );
}
