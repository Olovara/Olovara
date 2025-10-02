"use client";
import React from "react";
import { Upload, Image, FileText, Video, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  sellerId: string;
};

const MediaBucketTab = (props: Props) => {
  return (
    <div className="h-[900px] overflow-scroll p-4">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Media Library
            </CardTitle>
            <CardDescription>
              Upload and manage your media files for your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Image className="h-4 w-4" aria-label="Images icon" />
              Images
            </div>
            <div className="text-xs text-muted-foreground mt-1">0 files</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              Videos
            </div>
            <div className="text-xs text-muted-foreground mt-1">0 files</div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground text-sm py-8">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No media files uploaded yet</p>
              <p className="text-xs mt-1">
                Upload images, videos, and documents to use in your website
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Image className="mr-2 h-4 w-4" aria-label="Upload icon" />
              Upload Images
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Video className="mr-2 h-4 w-4" />
              Upload Videos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>0 MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Available</span>
                <span>1 GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: "0%" }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaBucketTab;
