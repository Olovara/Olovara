"use client";

/**
 * Header Mapping Component
 * Allows sellers to map CSV headers to product fields
 * Uses Fuse.js for automatic mapping suggestions
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_FIELDS } from "@/lib/bulk-import/mapping";
import { CheckCircle2, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";

interface HeaderMappingProps {
  csvHeaders: string[];
  initialMapping?: Record<string, string>;
  sourcePlatform?: string;
  onMappingChange: (mapping: Record<string, string>) => void;
  onSave?: (mapping: Record<string, string>, name?: string) => Promise<void>;
}

export function HeaderMapping({
  csvHeaders,
  initialMapping = {},
  sourcePlatform,
  onMappingChange,
  onSave,
}: HeaderMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);
  const [mappingName, setMappingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMapping(initialMapping);
  }, [initialMapping]);

  const handleMappingChange = (csvHeader: string, productField: string) => {
    const newMapping = { ...mapping };
    
    if (productField === "UNMAP" || productField === "SKIP" || productField === "") {
      // Remove mapping
      delete newMapping[csvHeader];
    } else {
      // Update mapping
      newMapping[csvHeader] = productField;
    }

    setMapping(newMapping);
    onMappingChange(newMapping);
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(mapping, mappingName || undefined);
      toast.success("Mapping saved successfully");
    } catch (error) {
      toast.error("Failed to save mapping");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get required fields
  const requiredFields = PRODUCT_FIELDS.filter((f) => f.required);
  const mappedFields = Object.values(mapping);
  const missingRequired = requiredFields.filter(
    (f) => !mappedFields.includes(f.field)
  );

  // Group headers by mapping status
  // Filter out Wix headers that should be automatically skipped
  const headersToShow = csvHeaders.filter((h) => {
    if (sourcePlatform === "Wix") {
      // Automatically hide productOptionType1-6 headers (they just indicate field type like "dropdown")
      if (/^productOptionType\d+$/i.test(h)) {
        return false; // Don't show in unmapped columns
      }
      // Also hide additionalInfoTitle1-6 headers (Wix additional info fields)
      if (/^additionalInfoTitle\d+$/i.test(h)) {
        return false;
      }
      if (/^additionalInfo\d+$/i.test(h)) {
        return false;
      }
      // Note: additionalInfoDescription1-6 are marked as SKIP but will appear in unmapped columns for manual selection
    }
    return true;
  });
  
  const mappedHeaders = headersToShow.filter((h) => mapping[h] && mapping[h] !== "SKIP");
  const unmappedHeaders = headersToShow.filter((h) => !mapping[h]);

  // For a given CSV header, which product fields can still be chosen (not yet mapped, or mapped by this header)
  const getAvailableProductFields = (currentCsvHeader: string) =>
    PRODUCT_FIELDS.filter((field) => {
      const mappedByHeader = Object.entries(mapping).find(
        ([h, f]) => f === field.field && h !== currentCsvHeader
      );
      return !mappedByHeader;
    });

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      {sourcePlatform && (
        <Card>
          <CardHeader>
            <CardTitle>Source Platform</CardTitle>
            <div className="text-sm text-muted-foreground">
              Selected platform: <Badge>{sourcePlatform}</Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Mapping Status */}
      <Card>
        <CardHeader>
          <CardTitle>Mapping Status</CardTitle>
          <CardDescription>
            Map your CSV columns to product fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              {missingRequired.length === 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-600">
                    All required fields mapped
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-yellow-600">
                    {missingRequired.length} required field(s) missing
                  </span>
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {mappedHeaders.length} of {csvHeaders.length} columns mapped
            </div>
          </div>

          {missingRequired.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Missing required fields:
              </p>
              <div className="flex flex-wrap gap-2">
                {missingRequired.map((field) => (
                  <Badge key={field.field} variant="outline">
                    {field.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapped Headers */}
      {mappedHeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapped Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mappedHeaders.map((header) => {
                const productField = mapping[header];
                const fieldInfo = PRODUCT_FIELDS.find((f) => f.field === productField);
                const isRequired = fieldInfo?.required || false;

                return (
                  <div
                    key={header}
                    className="flex items-center gap-4 p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <Label className="font-medium">{header}</Label>
                      <p className="text-xs text-muted-foreground">
                        CSV Column
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">→</span>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={productField}
                        onValueChange={(value) =>
                          handleMappingChange(header, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNMAP">-- Unmap --</SelectItem>
                          {getAvailableProductFields(header).map((field) => (
                            <SelectItem key={field.field} value={field.field}>
                              {field.label}
                              {field.required && " *"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldInfo && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span>{fieldInfo.label}</span>
                          {isRequired && (
                            <Badge variant="outline">
                              Required
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unmapped Headers */}
      {unmappedHeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unmapped Columns</CardTitle>
            <CardDescription>
              Map these columns to product fields or leave them unmapped
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unmappedHeaders.map((header) => (
                <div
                  key={header}
                  className="flex items-center gap-4 p-3 border rounded-md"
                >
                  <div className="flex-1">
                    <Label className="font-medium">{header}</Label>
                    <p className="text-xs text-muted-foreground">CSV Column</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">→</span>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={undefined}
                      onValueChange={(value) =>
                        handleMappingChange(header, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SKIP">-- Skip --</SelectItem>
                        {getAvailableProductFields(header).map((field) => (
                          <SelectItem key={field.field} value={field.field}>
                            {field.label}
                            {field.required && " *"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Mapping */}
      {onSave && (
        <Card>
          <CardHeader>
            <CardTitle>Save Mapping</CardTitle>
            <CardDescription>
              Save this mapping for future imports from the same platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mapping-name">Mapping Name (Optional)</Label>
                <Input
                  id="mapping-name"
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  placeholder="e.g., My Etsy Export"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || missingRequired.length > 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Mapping"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



