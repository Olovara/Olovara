"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flag, Eye, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  reportType: "SELLER" | "PRODUCT";
  targetId: string;
  targetName: string;
  category: string;
  subReason?: string;
  description: string;
  evidence?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED" | "ESCALATED";
  adminNotes?: string;
  resolutionNotes?: string;
  reporter?: {
    id: string;
    username?: string;
    email?: string;
  };
  reporterName?: string;
  reporterEmail?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportsResponse {
  reports: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const SEVERITY_COLORS = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  DISMISSED: "bg-gray-100 text-gray-800",
  ESCALATED: "bg-red-100 text-red-800",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    severity: "all",
    reportType: "all",
  });

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value && value !== "all")),
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error("Failed to fetch reports");

      const data: ReportsResponse = await response.json();
      setReports(data.reports);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleStatusUpdate = async () => {
    if (!selectedReport || !updateStatus) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updateStatus,
          adminNotes: updateNotes,
        }),
      });

      if (!response.ok) throw new Error("Failed to update report");

      toast.success("Report updated successfully");
      setIsUpdateModalOpen(false);
      setSelectedReport(null);
      setUpdateStatus("");
      setUpdateNotes("");
      fetchReports();
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report");
    } finally {
      setUpdating(false);
    }
  };

  const openDetailModal = (report: Report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const openUpdateModal = (report: Report) => {
    setSelectedReport(report);
    setUpdateStatus(report.status);
    setUpdateNotes(report.adminNotes || "");
    setIsUpdateModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      INAPPROPRIATE_CONTENT: "Inappropriate Content",
      COPYRIGHT_INFRINGEMENT: "Copyright Infringement",
      MISLEADING_INFORMATION: "Misleading Information",
      POOR_QUALITY: "Poor Quality",
      FAKE_PRODUCTS: "Fake Products",
      HARASSMENT: "Harassment",
      SPAM: "Spam",
      OTHER: "Other",
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports Management</h1>
          <p className="text-gray-600">Review and manage user reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-red-600" />
          <span className="text-sm text-gray-600">
            {pagination.total} total reports
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                  <SelectItem value="ESCALATED">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="INAPPROPRIATE_CONTENT">Inappropriate Content</SelectItem>
                  <SelectItem value="COPYRIGHT_INFRINGEMENT">Copyright Infringement</SelectItem>
                  <SelectItem value="MISLEADING_INFORMATION">Misleading Information</SelectItem>
                  <SelectItem value="POOR_QUALITY">Poor Quality</SelectItem>
                  <SelectItem value="FAKE_PRODUCTS">Fake Products</SelectItem>
                  <SelectItem value="HARASSMENT">Harassment</SelectItem>
                  <SelectItem value="SPAM">Spam</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Severity</Label>
              <Select
                value={filters.severity}
                onValueChange={(value) => setFilters({ ...filters, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={filters.reportType}
                onValueChange={(value) => setFilters({ ...filters, reportType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="SELLER">Seller</SelectItem>
                  <SelectItem value="PRODUCT">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {report.reportType}
                    </Badge>
                    <Badge className={`text-xs ${SEVERITY_COLORS[report.severity]}`}>
                      {report.severity}
                    </Badge>
                    <Badge className={`text-xs ${STATUS_COLORS[report.status]}`}>
                      {report.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">
                    {report.targetName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {getCategoryLabel(report.category)}
                    {report.subReason && ` • ${report.subReason}`}
                  </p>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {report.description}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>Reported {formatDate(report.createdAt)}</span>
                    {report.reporter && (
                      <span>by {report.reporter.username || report.reporter.email}</span>
                    )}
                    {report.reporterName && (
                      <span>by {report.reporterName}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetailModal(report)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUpdateModal(report)}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{selectedReport.reportType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Target</Label>
                  <p className="text-sm">{selectedReport.targetName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{getCategoryLabel(selectedReport.category)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity</Label>
                  <Badge className={SEVERITY_COLORS[selectedReport.severity]}>
                    {selectedReport.severity}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1">{selectedReport.description}</p>
              </div>

              {selectedReport.evidence && (
                <div>
                  <Label className="text-sm font-medium">Evidence</Label>
                  <p className="text-sm mt-1">{selectedReport.evidence}</p>
                </div>
              )}

              {selectedReport.adminNotes && (
                <div>
                  <Label className="text-sm font-medium">Admin Notes</Label>
                  <p className="text-sm mt-1">{selectedReport.adminNotes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p>{formatDate(selectedReport.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated</Label>
                  <p>{formatDate(selectedReport.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Report Status</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                  <SelectItem value="ESCALATED">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Add notes about this report..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUpdateModalOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 