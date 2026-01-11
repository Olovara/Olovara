"use client";

/**
 * Bulk Import Page
 * Allows sellers to upload CSV files and import products in bulk
 */

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HeaderMapping } from "@/components/bulk-import/HeaderMapping";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  ArrowRight,
  Plus,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  Categories,
  getTertiaryCategories,
  SecondaryCategoryID,
} from "@/data/categories";
import ShippingOptionModal from "@/components/onboarding/ShippingOptionModal";
import { useEffect, useCallback } from "react";

const SUPPORTED_PLATFORMS = [
  "Etsy",
  "Shopify",
  "WooCommerce",
  "Squarespace",
  "Wix",
  "Other",
];

const MAX_ROWS = 500;

export default function BulkImportPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Step 1: File Upload
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Step 2: Mapping
  const [sourcePlatform, setSourcePlatform] = useState<string>("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappingId, setMappingId] = useState<string | undefined>();

  // Step 3: Import
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [failedRowsCount, setFailedRowsCount] = useState(0);

  // Step 2.5: Category Selection
  const [primaryCategory, setPrimaryCategory] = useState<string>("");
  const [secondaryCategory, setSecondaryCategory] = useState<string>("");
  const [tertiaryCategory, setTertiaryCategory] = useState<string>("");

  // Shipping settings
  const [freeShipping, setFreeShipping] = useState<boolean>(false);
  const [shippingOptionId, setShippingOptionId] = useState<string>("");
  const [handlingFee, setHandlingFee] = useState<string>("0");
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Fetch shipping options
  const fetchShippingOptions = useCallback(
    async (newShippingOptionId?: string) => {
      try {
        const response = await fetch("/api/shipping-options");
        if (!response.ok) throw new Error("Failed to fetch shipping options");
        const data = await response.json();
        setShippingOptions(data);

        // Auto-select the newly created shipping option
        if (newShippingOptionId && !shippingOptionId) {
          setShippingOptionId(newShippingOptionId);
        }
      } catch (error) {
        console.error("Error fetching shipping options:", error);
      }
    },
    [shippingOptionId]
  );

  useEffect(() => {
    if (currentStep === 3) {
      // Fetch shipping options when on category/shipping step
      fetchShippingOptions();
    }
  }, [currentStep, fetchShippingOptions]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);

    try {
      // Read and parse CSV
      const fileContent = await selectedFile.text();
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        toast.error("Failed to parse CSV file");
        console.error(parseResult.errors);
        return;
      }

      const rows = parseResult.data as any[];
      const headers = parseResult.meta.fields || [];

      if (rows.length === 0) {
        toast.error("CSV file is empty");
        return;
      }

      // Check row limit
      if (rows.length > MAX_ROWS) {
        toast.warning(
          `CSV has ${rows.length} rows. Only the first ${MAX_ROWS} will be processed.`
        );
      }

      setCsvData(rows);
      setCsvHeaders(headers);
      setPreviewRows(rows.slice(0, 10));

      // Auto-generate mapping
      await generateMapping(headers);

      toast.success("CSV file uploaded successfully");
      setCurrentStep(2); // Go to mapping step
    } catch (error) {
      toast.error("Failed to process CSV file");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Generate mapping
  const generateMapping = async (headers?: string[]) => {
    const headersToUse = headers || csvHeaders;
    if (headersToUse.length === 0) return;

    try {
      const response = await fetch(
        `/api/bulk-import/mapping?headers=${headersToUse.join(",")}&platform=${sourcePlatform || ""}`
      );

      if (!response.ok) {
        throw new Error("Failed to generate mapping");
      }

      const data = await response.json();
      setMapping(data.mapping || {});
    } catch (error) {
      console.error("Failed to generate mapping:", error);
    }
  };

  // Handle platform change
  const handlePlatformChange = async (platform: string) => {
    setSourcePlatform(platform);
    // Regenerate mapping with new platform
    await generateMapping();
  };

  // Save mapping
  const handleSaveMapping = async (
    mappingToSave: Record<string, string>,
    name?: string
  ) => {
    try {
      const response = await fetch("/api/bulk-import/mapping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mapping: mappingToSave,
          sourcePlatform,
          name,
          isDefault: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save mapping");
      }

      const data = await response.json();
      setMappingId(data.mappingId);
    } catch (error) {
      console.error("Failed to save mapping:", error);
      throw error;
    }
  };

  // Handle mapping complete - move to category selection
  const handleMappingComplete = () => {
    // Validate mapping
    const requiredFields = ["name", "description", "images[]"];
    const mappedFields = Object.values(mapping);
    const missing = requiredFields.filter((f) => !mappedFields.includes(f));

    if (missing.length > 0) {
      toast.error(`Please map all required fields: ${missing.join(", ")}`);
      return;
    }

    setCurrentStep(3); // Go to category selection
  };

  // Start import (after category selection)
  const handleStartImport = async () => {
    if (!csvData || csvData.length === 0) {
      toast.error("No CSV data to import");
      return;
    }

    // Validate categories
    if (!primaryCategory || !secondaryCategory) {
      toast.error("Please select primary and secondary categories");
      return;
    }

    try {
      const response = await fetch("/api/bulk-import/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csvData,
          mapping,
          sourcePlatform,
          mappingId,
          primaryCategory,
          secondaryCategory,
          tertiaryCategory: tertiaryCategory || undefined,
          freeShipping,
          shippingOptionId: freeShipping
            ? undefined
            : shippingOptionId && shippingOptionId.trim() !== ""
              ? shippingOptionId
              : undefined,
          handlingFee: parseFloat(handlingFee) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start import");
      }

      const data = await response.json();
      setJobId(data.jobId);
      setCurrentStep(4); // Go to progress step
      setJobStatus("QUEUED");

      // Poll for job status
      pollJobStatus(data.jobId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start import"
      );
      console.error(error);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobIdToPoll: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/bulk-import/status/${jobIdToPoll}`);
        if (!response.ok) return;

        const data = await response.json();
        const job = data.job;

        setJobStatus(job.status);
        setJobProgress(
          job.totalRows > 0
            ? Math.round((job.processed / job.totalRows) * 100)
            : 0
        );

        // Track failed rows count
        if (job.failedRows && Array.isArray(job.failedRows)) {
          setFailedRowsCount(job.failedRows.length);
        } else {
          setFailedRowsCount(0);
        }

        if (job.status === "DONE" || job.status === "FAILED") {
          clearInterval(interval);
          if (job.status === "DONE") {
            const failedCount =
              job.failedRows && Array.isArray(job.failedRows)
                ? job.failedRows.length
                : 0;
            const needsReviewCount = job.needsInventoryReviewCount || 0;

            // Build completion message
            let message = `Import completed! ${job.successCount} products imported successfully.`;

            if (failedCount > 0) {
              message += ` ${failedCount} rows failed.`;
            }

            if (needsReviewCount > 0) {
              message += ` ${needsReviewCount} product${needsReviewCount === 1 ? "" : "s"} need${needsReviewCount === 1 ? "s" : ""} inventory review.`;
            }

            toast.success(message);
          } else {
            toast.error("Import failed");
          }
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  };

  // Download failed rows
  const handleDownloadFailedRows = () => {
    if (!jobId) return;
    window.open(`/api/bulk-import/failed-rows/${jobId}`, "_blank");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Import Products</h1>
        <p className="text-muted-foreground">
          Import products from CSV files. Perfect for migrating from other
          platforms like Etsy, Shopify, or WooCommerce.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center gap-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-muted"
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-0.5 ${
                  currentStep > step ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload CSV */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file containing your products. Maximum {MAX_ROWS}{" "}
              rows per import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </div>

              {file && (
                <div className="p-4 border rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">{file.name}</span>
                    <Badge>{file.size} bytes</Badge>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Processing CSV file...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map Headers */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* CSV Preview */}
          <Card>
            <CardHeader>
              <CardTitle>CSV Preview</CardTitle>
              <CardDescription>
                Preview of your CSV data ({csvData.length} total rows, showing
                first 10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {csvHeaders.map((header) => (
                        <th
                          key={header}
                          className="border p-2 text-left font-medium"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx}>
                        {csvHeaders.map((header) => (
                          <td key={header} className="border p-2">
                            {String(row[header] || "").slice(0, 50)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Source Platform</CardTitle>
              <CardDescription>
                Select where your CSV is coming from for better auto-mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={sourcePlatform}
                onValueChange={handlePlatformChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_PLATFORMS.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Header Mapping */}
          <HeaderMapping
            csvHeaders={csvHeaders}
            initialMapping={mapping}
            sourcePlatform={sourcePlatform}
            onMappingChange={setMapping}
            onSave={handleSaveMapping}
          />

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button onClick={handleMappingComplete}>
              Continue to Categories
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Category Selection */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Categories</CardTitle>
            <CardDescription>
              Choose the categories that will be applied to all products in this
              import. These categories will override any category data in your
              CSV.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Primary Category */}
              <div>
                <Label htmlFor="primary-category">Primary Category *</Label>
                <Select
                  value={primaryCategory}
                  onValueChange={(value) => {
                    setPrimaryCategory(value);
                    setSecondaryCategory(""); // Reset secondary when primary changes
                    setTertiaryCategory(""); // Reset tertiary when primary changes
                  }}
                >
                  <SelectTrigger id="primary-category">
                    <SelectValue placeholder="Select primary category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Secondary Category */}
              {primaryCategory && (
                <div>
                  <Label htmlFor="secondary-category">
                    Secondary Category *
                  </Label>
                  <Select
                    value={secondaryCategory}
                    onValueChange={(value) => {
                      setSecondaryCategory(value);
                      setTertiaryCategory(""); // Reset tertiary when secondary changes
                    }}
                  >
                    <SelectTrigger id="secondary-category">
                      <SelectValue placeholder="Select secondary category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Categories.find(
                        (c) => c.id === primaryCategory
                      )?.children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tertiary Category */}
              {secondaryCategory &&
                (() => {
                  const primary = Categories.find(
                    (c) => c.id === primaryCategory
                  );
                  const secondary = primary?.children.find(
                    (c) => c.id === secondaryCategory
                  );
                  const hasTertiary =
                    secondary &&
                    "children" in secondary &&
                    secondary.children &&
                    secondary.children.length > 0;

                  return hasTertiary ? (
                    <div>
                      <Label htmlFor="tertiary-category">
                        Tertiary Category (Optional)
                      </Label>
                      <Select
                        value={tertiaryCategory}
                        onValueChange={setTertiaryCategory}
                      >
                        <SelectTrigger id="tertiary-category">
                          <SelectValue placeholder="Select tertiary category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {secondary.children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null;
                })()}

              {/* Shipping Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Shipping Settings
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure shipping options that will be applied to all
                    products in this import.
                  </p>
                </div>

                {/* Free Shipping Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="free-shipping"
                    checked={freeShipping}
                    onChange={(e) => {
                      setFreeShipping(e.target.checked);
                      if (e.target.checked) {
                        setShippingOptionId("");
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="free-shipping" className="cursor-pointer">
                    Free Shipping
                  </Label>
                </div>

                {/* Shipping Option */}
                {!freeShipping && (
                  <div>
                    <Label htmlFor="shipping-option">Shipping Option *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={shippingOptionId}
                        onValueChange={setShippingOptionId}
                      >
                        <SelectTrigger id="shipping-option">
                          <SelectValue placeholder="Select a shipping option" />
                        </SelectTrigger>
                        <SelectContent>
                          {shippingOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}{" "}
                              {option.isDefault ? "(Default)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsShippingModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        New
                      </Button>
                    </div>
                    {shippingOptions.length === 0 && (
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center mt-2">
                        <Truck className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">
                          No shipping options yet
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsShippingModalOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Shipping Option
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a shipping option or create a new one
                    </p>
                  </div>
                )}

                {/* Handling Fee */}
                <div>
                  <Label htmlFor="handling-fee">Handling Fee (Optional)</Label>
                  <Input
                    id="handling-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={handlingFee}
                    onChange={(e) => setHandlingFee(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Additional handling fee per product (optional)
                  </p>
                </div>
              </div>

              {/* Shipping Option Modal */}
              <ShippingOptionModal
                isOpen={isShippingModalOpen}
                onOpenChange={setIsShippingModalOpen}
                onSuccess={(newShippingOptionId) => {
                  fetchShippingOptions(newShippingOptionId);
                }}
              />

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleStartImport}
                  disabled={!primaryCategory || !secondaryCategory}
                >
                  Start Import
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Import Progress */}
      {currentStep === 4 && jobId && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
            <CardDescription>
              Your products are being imported...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {jobProgress}%
                  </span>
                </div>
                <Progress value={jobProgress} />
              </div>

              <div className="flex items-center gap-2">
                {jobStatus === "DONE" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600">
                      Import completed successfully
                    </span>
                  </>
                ) : jobStatus === "FAILED" ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">Import failed</span>
                  </>
                ) : (
                  <>
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">
                      {jobStatus === "QUEUED"
                        ? "Waiting to start..."
                        : jobStatus === "RUNNING"
                          ? "Processing..."
                          : "Unknown status"}
                    </span>
                  </>
                )}
              </div>

              {jobStatus === "DONE" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push("/seller/dashboard/products")}
                  >
                    View Products
                  </Button>
                  {failedRowsCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleDownloadFailedRows}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Failed Rows ({failedRowsCount})
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
