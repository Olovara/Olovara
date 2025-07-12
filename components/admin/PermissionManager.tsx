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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import { usePermissions } from "@/components/providers/PermissionProvider";

interface PermissionManagerProps {
  userId: string;
  userPermissions: any[];
}

export function PermissionManager({ userId, userPermissions }: PermissionManagerProps) {
  const [selectedPermission, setSelectedPermission] = useState("");
  const [reason, setReason] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [permissionToRemove, setPermissionToRemove] = useState<string | null>(null);
  
  const { refreshPermissions } = usePermissions();

  const getUnassignedPermissions = () => {
    const assignedPermissions = new Set(userPermissions.map((p: any) => p.permission));
    
    const unassignedGroups: Record<string, { value: string; label: string }[]> = {};
    
    Object.entries(PERMISSIONS).forEach(([key, permission]) => {
      if (!assignedPermissions.has(permission.value)) {
        const group = permission.group;
        if (!unassignedGroups[group]) {
          unassignedGroups[group] = [];
        }
        unassignedGroups[group].push({
          value: permission.value,
          label: permission.label
        });
      }
    });
    
    return unassignedGroups;
  };

  const unassignedPermissionGroups = getUnassignedPermissions();

  const handleAddPermission = async () => {
    if (!selectedPermission) {
      toast.error("Please select a permission");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permission: selectedPermission,
          reason: reason,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(`${result.message}. User's permissions have been updated.`);
        setSelectedPermission("");
        setReason("");
        
        // Refresh permissions for the current user if they're managing their own permissions
        await refreshPermissions();
      } else {
        toast.error(result.error || "Failed to add permission");
      }
    } catch (error) {
      toast.error("An error occurred while adding permission");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePermission = async (permission: string) => {
    setIsRemoving(permission);
    try {
      const response = await fetch(`/api/users/${userId}/permissions?permission=${encodeURIComponent(permission)}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(`${result.message}. User's permissions have been updated.`);
        
        // Refresh permissions for the current user if they're managing their own permissions
        await refreshPermissions();
      } else {
        toast.error(result.error || "Failed to remove permission");
      }
    } catch (error) {
      toast.error("An error occurred while removing permission");
    } finally {
      setIsRemoving(null);
      setShowRemoveDialog(false);
      setPermissionToRemove(null);
    }
  };

  const openRemoveDialog = (permission: string) => {
    setPermissionToRemove(permission);
    setShowRemoveDialog(true);
  };

  const closeRemoveDialog = () => {
    setShowRemoveDialog(false);
    setPermissionToRemove(null);
  };

  const confirmRemove = () => {
    if (permissionToRemove) {
      handleRemovePermission(permissionToRemove);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Permissions</CardTitle>
          <CardDescription>
            Add new permissions for this user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Permission Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Add New Permission</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="permission">Permission</Label>
                <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(unassignedPermissionGroups).length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        All permissions already assigned
                      </div>
                    ) : (
                      Object.entries(unassignedPermissionGroups).map(([groupName, permissions]) => (
                        <div key={groupName}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {groupName}
                          </div>
                          {permissions.map((permission) => (
                            <SelectItem key={permission.value} value={permission.value}>
                              {permission.label}
                            </SelectItem>
                          ))}
                        </div>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  placeholder="Why is this permission being granted?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleAddPermission} 
              disabled={isAdding || !selectedPermission}
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? "Adding..." : "Add Permission"}
            </Button>
          </div>

          {/* Current Permissions Summary */}
          {userPermissions.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Currently Assigned Permissions</h4>
              <div className="space-y-2">
                {userPermissions.map((perm: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Badge variant="outline" className="mr-2">
                        {perm.permission}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRemoveDialog(perm.permission)}
                      disabled={isRemoving === perm.permission}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Permission Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the permission <strong>&quot;{permissionToRemove}&quot;</strong> from this user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeRemoveDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving === permissionToRemove ? "Removing..." : "Remove Permission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 