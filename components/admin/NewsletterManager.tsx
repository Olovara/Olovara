"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Users, Send, Eye, TestTube } from "lucide-react";
import { NewsletterSendSchema } from "@/schemas/NewsletterSchema";

interface NewsletterStats {
  total: number;
  active: number;
  new: number;
}

interface RecentSubscriber {
  email: string;
  createdAt: string;
  source: string;
}

export default function NewsletterManager() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "active" | "new">("all");
  const [testMode, setTestMode] = useState(false);
  const [testEmails, setTestEmails] = useState<string[]>([]);
  const [testEmailInput, setTestEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [recentSubscribers, setRecentSubscribers] = useState<RecentSubscriber[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Load statistics on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/newsletter/send");
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
        setRecentSubscribers(data.recentSubscribers);
      }
    } catch (error) {
      console.error("Failed to load newsletter stats:", error);
    }
  };

  const addTestEmail = () => {
    if (testEmailInput && !testEmails.includes(testEmailInput)) {
      setTestEmails([...testEmails, testEmailInput]);
      setTestEmailInput("");
    }
  };

  const removeTestEmail = (email: string) => {
    setTestEmails(testEmails.filter(e => e !== email));
  };

  const handleSendNewsletter = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (testMode && testEmails.length === 0) {
      toast.error("Please add at least one test email");
      return;
    }

    setIsLoading(true);

    try {
      const newsletterData = {
        subject: subject.trim(),
        content: content.trim(),
        previewText: previewText.trim() || undefined,
        targetAudience,
        testMode,
        testEmails: testMode ? testEmails : undefined,
        sendImmediately: true,
      };

      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newsletterData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Newsletter sent successfully! ${data.summary.successful}/${data.summary.total} emails delivered.`
        );
        
        // Reset form
        setSubject("");
        setContent("");
        setPreviewText("");
        setTestEmails([]);
        setTestMode(false);
        
        // Reload stats
        loadStats();
      } else {
        toast.error(data.error || "Failed to send newsletter");
      }
    } catch (error) {
      console.error("Newsletter sending error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getAudienceCount = () => {
    if (!stats) return 0;
    
    switch (targetAudience) {
      case "all":
        return stats.active;
      case "active":
        return stats.active - stats.new;
      case "new":
        return stats.new;
      default:
        return stats.active;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently subscribed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.new || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Create Newsletter
          </CardTitle>
          <CardDescription>
            Write and send newsletters to your subscribers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject Line */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter newsletter subject..."
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {subject.length}/100 characters
            </p>
          </div>

          {/* Preview Text */}
          <div className="space-y-2">
            <Label htmlFor="preview">Preview Text</Label>
            <Input
              id="preview"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Brief preview text for email clients..."
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="audience">Target Audience</Label>
            <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Active Subscribers ({stats?.active || 0})</SelectItem>
                <SelectItem value="active">Long-term Subscribers ({Math.max(0, (stats?.active || 0) - (stats?.new || 0))})</SelectItem>
                <SelectItem value="new">New Subscribers ({stats?.new || 0})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Test Mode */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="test-mode"
                checked={testMode}
                onCheckedChange={setTestMode}
              />
              <Label htmlFor="test-mode">Test Mode</Label>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </div>

            {testMode && (
              <div className="space-y-2">
                <Label>Test Email Addresses</Label>
                <div className="flex gap-2">
                  <Input
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    placeholder="Enter test email..."
                    type="email"
                  />
                  <Button onClick={addTestEmail} size="sm">
                    Add
                  </Button>
                </div>
                {testEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {testEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          onClick={() => removeTestEmail(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Newsletter Content *</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your newsletter content here... You can use HTML tags for formatting."
              rows={12}
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/10,000 characters
            </p>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-md p-4 bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          )}

          <Separator />

          {/* Send Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {testMode 
                ? `Will send to ${testEmails.length} test email(s)`
                : `Will send to ${getAudienceCount()} subscriber(s)`
              }
            </div>
            <Button 
              onClick={handleSendNewsletter} 
              disabled={isLoading || !subject.trim() || !content.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? "Sending..." : "Send Newsletter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Subscribers */}
      {recentSubscribers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscribers</CardTitle>
            <CardDescription>
              Latest newsletter subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSubscribers.map((subscriber, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-mono">{subscriber.email}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {subscriber.source}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(subscriber.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 