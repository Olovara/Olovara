import { getUnapprovedSellers } from "@/actions/adminActions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApplicationActions } from "./ApplicationActions";

export const metadata = {
  title: "Seller Application",
};

export default async function AdminDashboardSellerApplications() {
  const applications = await getUnapprovedSellers();

  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Seller Applications</CardTitle>
          <CardDescription>All unapproved seller applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="font-medium">
                      {application.user.username}
                    </div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {application.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Pending</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(application.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ApplicationActions
                      application={{
                        userId: application.userId,
                        username: application.user.username,
                        email: application.user.email,
                        craftingProcess: application.craftingProcess,
                        portfolio: application.portfolio,
                        reason: application.interestInJoining,
                        id: application.id, // Make sure this is the correct field for the application's ID
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
