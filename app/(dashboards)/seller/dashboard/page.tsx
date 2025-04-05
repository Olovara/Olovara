import SellerDashboardInfo from "./SellerDashboardInfo";

export const metadata = {
  title: "Seller - Dashboard",
};

export default function SellerDashboardHome() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Seller Dashboard</h1>
      <SellerDashboardInfo /> {/* Render the client-side dashboard */}
    </div>
  );
}