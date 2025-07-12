"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ROLES } from "@/data/roles-and-permissions";
import { usePermissions } from "@/components/providers/PermissionProvider";

interface RoleManagerProps {
  userId: string;
  currentRole: string;
  username?: string;
  currentUser?: { email?: string; id?: string };
}

export function RoleManager({ userId, currentRole, username, currentUser }: RoleManagerProps) {
  const [selectedRole, setSelectedRole] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { refreshPermissions } = usePermissions();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="destructive">Super Admin</Badge>;
      case 'ADMIN':
        return <Badge variant="default">Admin</Badge>;
      case 'SELLER':
        return <Badge variant="secondary">Seller</Badge>;
      case 'MEMBER':
        return <Badge variant="outline">Member</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return "Full access to all system features and administrative functions";
      case 'ADMIN':
        return "Access to admin dashboard and most administrative functions";
      case 'SELLER':
        return "Access to seller dashboard and product management";
      case 'MEMBER':
        return "Standard member access with basic features";
      default:
        return "Unknown role";
    }
  };

  const handleRoleChange = async () => {
    if (!selectedRole || !reason.trim()) {
      toast.error("Please select a role and provide a reason");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newRole: selectedRole,
          reason: reason.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("User role updated successfully");
        setIsDialogOpen(false);
        setSelectedRole("");
        setReason("");
        
        // Refresh permissions for the current user if they're managing their own role
        await refreshPermissions();
      } else {
        toast.error(result.error || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("An error occurred while updating the user role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Management
        </CardTitle>
        <CardDescription>
          Change user role and assign appropriate permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-1">
              How to change a user&apos;s role:
            </p>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Select a different role from the dropdown below</li>
              <li>Provide a reason for the role change</li>
              <li>Click &quot;Update Role&quot; when the button becomes active</li>
            </ol>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Current Role</Label>
          <div className="flex items-center gap-2">
            {getRoleBadge(currentRole)}
            <span className="text-sm text-muted-foreground">
              {getRoleDescription(currentRole)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role-select">New Role</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role-select">
              <SelectValue placeholder="Select a different role..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(key)}
                    <span className="text-sm text-muted-foreground">
                      {getRoleDescription(key)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRole === currentRole && selectedRole && (
            <p className="text-sm text-amber-600">
              ⚠️ Please select a different role to enable role changes
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Change <span className="text-red-500">*</span></Label>
          <Input
            id="reason"
            placeholder="Explain why you're changing this user's role (required)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full"
          />
          {!reason.trim() && (
            <p className="text-sm text-amber-600">
              ⚠️ Please provide a reason for the role change
            </p>
          )}
        </div>

        {selectedRole !== currentRole && selectedRole && reason.trim() && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">
                  Role Change Warning
                </p>
                <p className="text-amber-700 mt-1">
                  Changing a user&apos;s role will affect their access to different parts of the system. 
                  This action will be logged and requires a reason.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={() => setIsDialogOpen(true)}
          disabled={selectedRole === currentRole || !reason.trim()}
          className="w-full"
        >
          {selectedRole === currentRole && selectedRole 
            ? "Select a different role" 
            : !reason.trim() 
            ? "Add a reason for the change"
            : "Update Role"
          }
        </Button>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to change {username || "this user"}&apos;s role from{" "}
                <strong>{currentRole}</strong> to <strong>{selectedRole}</strong>?
                <br /><br />
                <strong>Reason:</strong> {reason}
                <br /><br />
                This action will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Update the user&apos;s role immediately</li>
                  <li>Grant them the permissions associated with the new role</li>
                  <li>Update their session to reflect the new permissions</li>
                  <li>Log this action for audit purposes</li>
                  <li>Require the user to refresh their session</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRoleChange}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? "Updating..." : "Confirm Change"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
} 