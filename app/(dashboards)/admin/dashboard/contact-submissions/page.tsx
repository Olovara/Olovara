import { getContactSubmissions } from "@/actions/adminActions";
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
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Calendar,
  Eye
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ContactSubmissionsSearch } from "@/components/admin/ContactSubmissionsSearch";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Admin - Contact Submissions",
};

export default async function ContactSubmissionsPage({
  searchParams,
}: {
  searchParams: { search?: string; reason?: string; page?: string };
}) {
  const search = searchParams.search || "";
  const reason = searchParams.reason || "";
  const page = parseInt(searchParams.page || "1");

  const submissions = await getContactSubmissions({ search, reason, page });

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getReasonBadge = (reason: string) => {
    const reasonMap: { [key: string]: { label: string; variant: "default" | "secondary" | "outline" | "destructive" } } = {
      'BILLING': { label: 'Billing', variant: 'default' },
      'GENERAL': { label: 'General', variant: 'secondary' },
      'LISTING': { label: 'Listing Issue', variant: 'outline' },
      'ACCOUNT': { label: 'Account Support', variant: 'secondary' },
      'PAYMENT': { label: 'Payment Problem', variant: 'destructive' },
      'FEATURE': { label: 'Feature Request', variant: 'outline' },
      'BUG': { label: 'Bug Report', variant: 'destructive' },
      'OTHER': { label: 'Other', variant: 'outline' },
    };

    const config = reasonMap[reason] || { label: reason, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Submissions</h1>
          <p className="text-muted-foreground">
            Manage and respond to customer inquiries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {submissions.total} total submissions
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.thisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              New submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.thisWeek.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              New submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              New submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Submissions</CardTitle>
          <CardDescription>
            Search and filter contact form submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactSubmissionsSearch />
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Latest contact form submissions from customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.data.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium">{submission.name}</div>
                        <div className="text-sm text-muted-foreground">{submission.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getReasonBadge(submission.reason)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm">
                          {truncateText(submission.helpDescription, 80)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(submission.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/dashboard/contact-submissions/${submission.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {submissions.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, submissions.total)} of {submissions.total} submissions
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`?page=${page - 1}&search=${search}&reason=${reason}`}>
                      Previous
                    </Link>
                  </Button>
                )}
                {page < submissions.totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`?page=${page + 1}&search=${search}&reason=${reason}`}>
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 