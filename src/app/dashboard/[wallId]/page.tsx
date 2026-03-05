"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, ExternalLink, Upload, Trash2, Check, X,
  Loader2, Heart, Flag, Lock, Settings, Image as ImageIcon,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import type { Wall, Tribute } from "@/lib/types";

export default function WallDashboardPage() {
  const params = useParams();
  const wallId = params.wallId as string;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [wall, setWall] = useState<Wall | null>(null);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const [wallRes, tributesRes] = await Promise.all([
        fetch(`/api/walls/${wallId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/walls/${wallId}/tributes?all=true`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!wallRes.ok) throw new Error();
      const wallData = await wallRes.json();
      setWall(wallData);
      setTitle(wallData.title);
      setDescription(wallData.description || "");
      if (tributesRes.ok) {
        const tributesData = await tributesRes.json();
        setTributes(tributesData);
      }
    } catch {
      toast.error("Failed to load wall");
    } finally {
      setLoading(false);
    }
  }, [wallId, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/signin"); return; }
    fetchData();
  }, [user, authLoading, router, fetchData]);

  const saveSettings = async () => {
    if (!wall || !user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/walls/${wall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setWall({ ...wall, ...updated });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleLock = async () => {
    if (!wall || !user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/walls/${wall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ locked: !wall.locked }),
      });
      setWall({ ...wall, locked: !wall.locked });
      toast.success(wall.locked ? "Wall unlocked" : "Wall locked");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleTributeAction = async (tributeId: string, action: "approve" | "reject" | "delete") => {
    if (!user || !wall) return;
    try {
      const token = await user.getIdToken();
      if (action === "delete") {
        await fetch(`/api/walls/${wall.id}/tributes/${tributeId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setTributes((prev) => prev.filter((t) => t.id !== tributeId));
      } else {
        const status = action === "approve" ? "published" : "rejected";
        await fetch(`/api/walls/${wall.id}/tributes/${tributeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status }),
        });
        setTributes((prev) =>
          prev.map((t) => (t.id === tributeId ? { ...t, status } : t))
        );
      }
      toast.success(action === "approve" ? "Tribute approved" : action === "reject" ? "Tribute rejected" : "Tribute deleted");
    } catch {
      toast.error("Action failed");
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!wall || !user) return;
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("context", "gallery");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error();
        const { url, type } = await uploadRes.json();

        const newItem = {
          id: crypto.randomUUID(),
          url,
          type,
          alt: file.name,
          order: (wall.galleryItems || []).length,
        };
        const updatedItems = [...(wall.galleryItems || []), newItem];

        const token = await user.getIdToken();
        await fetch(`/api/walls/${wall.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ galleryItems: updatedItems }),
        });
        setWall({ ...wall, galleryItems: updatedItems });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    toast.success("Gallery updated");
  };

  const removeGalleryItem = async (itemId: string) => {
    if (!wall || !user) return;
    const updatedItems = (wall.galleryItems || []).filter((i) => i.id !== itemId);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/walls/${wall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ galleryItems: updatedItems }),
      });
      setWall({ ...wall, galleryItems: updatedItems });
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const deleteWall = async () => {
    if (!wall || !user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/walls/${wall.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Wall deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete wall");
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (!wall) {
    return <div className="min-h-screen flex items-center justify-center">Wall not found</div>;
  }

  const pendingTributes = tributes.filter((t) => t.status === "pending");
  const flaggedTributes = tributes.filter((t) => t.reportCount > 0);
  const publishedTributes = tributes.filter((t) => t.status === "published");
  const totalLikes = tributes.reduce((sum, t) => sum + t.likes, 0);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold flex-1">{wall.title}</h1>
        <Link href={`/for/${wall.slug}`} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-1" /> View Wall
          </Button>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{publishedTributes.length}</p>
              <p className="text-xs text-muted-foreground">Tributes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{totalLikes}</p>
              <p className="text-xs text-muted-foreground">Total Likes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{pendingTributes.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{flaggedTributes.length}</p>
              <p className="text-xs text-muted-foreground">Flagged</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={pendingTributes.length > 0 ? "queue" : "tributes"}>
          <TabsList className="w-full max-w-lg mx-auto grid grid-cols-4">
            <TabsTrigger value="queue">
              Queue {pendingTributes.length > 0 && <Badge className="ml-1" variant="destructive">{pendingTributes.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="tributes">Tributes</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Approval Queue */}
          <TabsContent value="queue" className="mt-6">
            {pendingTributes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending tributes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTributes.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="pt-4 flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{t.displayName}</p>
                        <p className="text-sm mt-1">{t.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(t.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleTributeAction(t.id, "approve")}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleTributeAction(t.id, "reject")}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All Tributes */}
          <TabsContent value="tributes" className="mt-6">
            <div className="space-y-3">
              {tributes.map((t) => (
                <Card key={t.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{t.displayName}</p>
                          <Badge variant={t.status === "published" ? "default" : t.status === "pending" ? "secondary" : "destructive"}>
                            {t.status}
                          </Badge>
                          {t.reportCount > 0 && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                              <Flag className="w-3 h-3 mr-1" />{t.reportCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1">{t.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {t.likes}</span>
                          <span>{new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleTributeAction(t.id, "delete")}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gallery Manager */}
          <TabsContent value="gallery" className="mt-6">
            <div className="mb-4">
              <Label htmlFor="galleryUpload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload photos or videos</p>
                  <p className="text-xs text-muted-foreground">Photos: JPG, PNG, WEBP. Videos: MP4, MOV.</p>
                </div>
              </Label>
              <Input
                id="galleryUpload"
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
              />
            </div>
            {(wall.galleryItems || []).length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {wall.galleryItems.map((item) => (
                  <div key={item.id} className="relative group">
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.alt} className="w-full aspect-square object-cover rounded-lg" />
                    ) : (
                      <video src={item.url} className="w-full aspect-square object-cover rounded-lg" />
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeGalleryItem(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No gallery items yet</p>
              </div>
            )}
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Wall Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editTitle">Title</Label>
                  <Input id="editTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDesc">Description</Label>
                  <Textarea id="editDesc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} rows={3} />
                </div>
                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lock Wall</p>
                    <p className="text-sm text-muted-foreground">Prevent new tributes from being submitted</p>
                  </div>
                  <Switch checked={wall.locked} onCheckedChange={toggleLock} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Wall</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this wall?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All tributes and gallery items will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteWall} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
