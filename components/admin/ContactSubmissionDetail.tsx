"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Mail, 
  Calendar,
  User,
  MessageSquare,
  Copy
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  reason: string;
  helpDescription: string;
  createdAt: Date;
}

interface ContactSubmissionDetailProps {
  submission: ContactSubmission;
}

export function ContactSubmissionDetail({ submission }: ContactSubmissionDetailProps) {
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM dd, yyyy HH:mm:ss');
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if you want
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dashboard/contact-submissions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contact Submission</h1>
            <p className="text-muted-foreground">
              View details of customer inquiry
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getReasonBadge(submission.reason)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-medium">{submission.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">{submission.email}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(submission.email)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${submission.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason for Contact</label>
                <div className="mt-1">
                  {getReasonBadge(submission.reason)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg">{formatDate(submission.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-lg whitespace-pre-wrap leading-relaxed">
                  {submission.helpDescription}
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(submission.helpDescription)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <a href={`mailto:${submission.email}?subject=Re: Your inquiry about ${submission.reason.toLowerCase()}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Reply via Email
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/dashboard/contact-submissions`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Submission ID</label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {submission.id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant="secondary">New</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Message Length</label>
                <p className="text-sm">
                  {submission.helpDescription.length} characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Related Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Related</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/dashboard/users">
                  <User className="h-4 w-4 mr-2" />
                  View All Users
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/dashboard/messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Messages
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 