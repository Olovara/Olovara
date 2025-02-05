import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Seller - Dashboard",
};

export default function SellerDashboardHome() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <DashboardCard title="Total Sales" value="123" />
      <DashboardCard title="Total Revenue" value="$4,567.89" />
      <DashboardCard title="Total Products" value="56" />
      <DashboardCard title="Most Popular Product" value="Cozy Knit Blanket" />
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-bold">{value}</CardContent>
    </Card>
  );
}
