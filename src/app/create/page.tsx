"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import type { WallTone, TributePermission } from "@/lib/types";

export default function CreateWallPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<WallTone>("celebration");
  const [tributePermission, setTributePermission] = useState<TributePermission>("open");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) { router.push("/auth/signin"); return null; }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", "cover");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setCoverImageUrl(data.url);
    } catch {
      setError("Failed to upload cover image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/walls", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, coverImageUrl, tone, tributePermission }),
      });
      if (!res.ok) throw new Error("Failed to create wall");
      const wall = await res.json();
      router.push(`/dashboard/${wall.id}`);
    } catch {
      setError("Failed to create wall");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold">Create a Tribute Wall</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Wall Details</CardTitle>
            <CardDescription>Set up your tribute wall. You can edit these later.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Wall Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g. "Celebrating Mr. Smoke"'
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional subtitle or bio"
                  maxLength={280}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{description.length}/280</p>
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex items-center gap-4">
                  {coverImageUrl ? (
                    <img src={coverImageUrl} alt="Cover preview" className="w-32 h-20 object-cover rounded-md" />
                  ) : (
                    <div className="w-32 h-20 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverUpload}
                      disabled={uploading}
                      className="max-w-xs"
                    />
                    {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Wall Tone</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={tone === "celebration" ? "default" : "outline"}
                    onClick={() => setTone("celebration")}
                    className="flex-1"
                  >
                    Celebration
                  </Button>
                  <Button
                    type="button"
                    variant={tone === "memorial" ? "default" : "outline"}
                    onClick={() => setTone("memorial")}
                    className="flex-1"
                  >
                    In Memoriam
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="approval">Require Approval</Label>
                  <p className="text-xs text-muted-foreground">Review tributes before they appear on the wall</p>
                </div>
                <Switch
                  id="approval"
                  checked={tributePermission === "approval"}
                  onCheckedChange={(checked) => setTributePermission(checked ? "approval" : "open")}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Wall"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
