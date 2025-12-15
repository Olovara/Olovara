import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getQaUsers,
  getRecentQaEvents,
  getQaStats,
  toggleQaUserMode,
} from "@/actions/qa-management";
import { format } from "date-fns";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { QaUserToggle } from "./(components)/QaUserToggle";
import { QaEventViewer } from "./(components)/QaEventViewer";

export const dynamic = "force-dynamic";

export default async function AdminQaManagement() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all data in parallel
  const [qaUsersResult, recentEventsResult, statsResult] = await Promise.all([
    getQaUsers(),
    getRecentQaEvents(50),
    getQaStats(),
  ]);

  const qaUsers =
    qaUsersResult.success && qaUsersResult.users ? qaUsersResult.users : [];
  const recentEvents =
    recentEventsResult.success && recentEventsResult.events
      ? recentEventsResult.events
      : [];
  const stats =
    statsResult.success && statsResult.stats ? statsResult.stats : null;

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "MMM dd, yyyy HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="text-xs">
            Completed
          </Badge>
        );
      case "started":
        return (
          <Badge variant="secondary" className="text-xs">
            Started
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">QA User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage QA mode for users and view behavioral telemetry events
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>QA Users</CardDescription>
              <CardTitle className="text-2xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Events</CardDescription>
              <CardTitle className="text-2xl">{stats.totalEvents}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed Events</CardDescription>
              <CardTitle className="text-2xl">{stats.failedEvents}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Sessions</CardDescription>
              <CardTitle className="text-2xl">{stats.uniqueSessions}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">QA Users</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* QA Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QA Users ({qaUsers.length})</CardTitle>
              <CardDescription>
                Users with QA mode enabled. These users have full behavioral
                telemetry logged. Only enable QA mode for a small, controlled
                group (10-30 users max).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qaUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No QA users found. Enable QA mode for users to start tracking
                  events.
                  <br />
                  <span className="text-xs mt-2 block">
                    Go to Users page to enable QA mode for specific users.
                  </span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Events Logged</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qaUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.username || "No username"}
                        </TableCell>
                        <TableCell>{user.email || "No email"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user._count.qaEvents} events
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <QaUserToggle userId={user.id} isQaUser={true} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent QA Events</CardTitle>
              <CardDescription>
                Latest behavioral telemetry events from QA users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No events found. QA users need to interact with the platform
                  to generate events.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <QaEventViewer key={event.id} event={event} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <>
              {/* Events by Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Events by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.eventsByStatus.map((item) => (
                        <TableRow key={item.status}>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-right">
                            {item.count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Events by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Event Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Type</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.eventsByType.map((item) => (
                        <TableRow key={item.event}>
                          <TableCell className="font-mono text-sm">
                            {item.event}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
