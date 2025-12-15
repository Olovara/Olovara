"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Search,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorLogs } from "@/actions/adminActions";

interface ErrorLog {
  id: string;
  level: string;
  code: string;
  message: string;
  userId?: string;
  route?: string;
  method?: string;
  metadata?: any;
  error?: any;
  createdAt: Date;
}

interface ErrorLogsResponse {
  errorLogs: ErrorLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const LEVEL_COLORS = {
  info: "bg-blue-100 text-blue-800",
  warn: "bg-yellow-100 text-yellow-800",
  error: "bg-orange-100 text-orange-800",
  fatal: "bg-red-100 text-red-800",
};

const LEVEL_ICONS = {
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
  fatal: AlertCircle,
};

export default function ErrorLogsPage() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    level: "all",
    code: "",
    route: "",
  });

  const fetchErrorLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.level !== "all") {
        params.level = filters.level;
      }
      if (filters.code) {
        params.code = filters.code;
      }
      if (filters.route) {
        params.route = filters.route;
      }

      const data: ErrorLogsResponse = await getErrorLogs(params);
      setErrorLogs(data.errorLogs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching error logs:", error);
      toast.error("Failed to load error logs");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchErrorLogs();
  }, [fetchErrorLogs]);

  const openDetailModal = (log: ErrorLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getLevelIcon = (level: string) => {
    const Icon = LEVEL_ICONS[level as keyof typeof LEVEL_ICONS] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  if (loading && errorLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading error logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Error Logs</h1>
          <p className="text-gray-600">View and monitor application errors</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-gray-600">
            {pagination.total} total errors
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Level</Label>
              <Select
                value={filters.level}
                onValueChange={(value) =>
                  setFilters({ ...filters, level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="fatal">Fatal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Error Code</Label>
              <Input
                placeholder="Search by error code..."
                value={filters.code}
                onChange={(e) =>
                  setFilters({ ...filters, code: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Route</Label>
              <Input
                placeholder="Search by route..."
                value={filters.route}
                onChange={(e) =>
                  setFilters({ ...filters, route: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs List */}
      <div className="space-y-4">
        {errorLogs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No error logs found</p>
            </CardContent>
          </Card>
        ) : (
          errorLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        className={`text-xs ${LEVEL_COLORS[log.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.error}`}
                      >
                        <div className="flex items-center gap-1">
                          {getLevelIcon(log.level)}
                          {log.level.toUpperCase()}
                        </div>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.code}
                      </Badge>
                      {log.method && (
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-1">
                      {log.message}
                    </h3>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{formatDate(log.createdAt)}</span>
                      {log.route && (
                        <span className="font-mono">{log.route}</span>
                      )}
                      {log.userId && (
                        <span>User: {log.userId.substring(0, 8)}...</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailModal(log)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page - 1 })
            }
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
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page + 1 })
            }
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Level</Label>
                  <Badge
                    className={`mt-1 ${LEVEL_COLORS[selectedLog.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.error}`}
                  >
                    {selectedLog.level.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Error Code</Label>
                  <p className="text-sm mt-1 font-mono">{selectedLog.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Route</Label>
                  <p className="text-sm mt-1 font-mono">
                    {selectedLog.route || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Method</Label>
                  <p className="text-sm mt-1">{selectedLog.method || "N/A"}</p>
                </div>
                {selectedLog.userId && (
                  <div>
                    <Label className="text-sm font-medium">User ID</Label>
                    <p className="text-sm mt-1 font-mono">
                      {selectedLog.userId}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm mt-1">
                    {formatDate(selectedLog.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Message</Label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                  {selectedLog.message}
                </p>
              </div>

              {selectedLog.metadata && (
                <div>
                  <Label className="text-sm font-medium">Metadata</Label>
                  <pre className="text-xs mt-1 p-2 bg-gray-50 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.error && (
                <div>
                  <Label className="text-sm font-medium">Error Details</Label>
                  <pre className="text-xs mt-1 p-2 bg-red-50 rounded overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
