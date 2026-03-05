"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Heart, Flag, Trash2, Pin, Share2, Copy, Lock,
  Image as ImageIcon, Loader2, QrCode, X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import type { Wall, Tribute } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";

export default function WallPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [wall, setWall] = useState<Wall | null>(null);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTributeForm, setShowTributeForm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Tribute form state
  const [displayName, setDisplayName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("tributeDisplayName") || "" : ""
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCreator = user && wall && wall.creatorId === user.uid;

  const wallUrl = typeof window !== "undefined" ? window.location.href : "";

  const fetchWall = useCallback(async () => {
    try {
      const res = await fetch(`/api/walls/${slug}`);
      if (!res.ok) throw new Error("Wall not found");
      const data = await res.json();
      setWall(data);
      return data;
    } catch {
      setWall(null);
    }
  }, [slug]);

  const fetchTributes = useCallback(async (wallData?: Wall) => {
    const w = wallData || wall;
    if (!w) return;
    try {
      const res = await fetch(`/api/walls/${w.id}/tributes`);
      if (!res.ok) return;
      const data = await res.json();
      setTributes(data);
    } catch {
      // silently fail
    }
  }, [wall]);

  useEffect(() => {
    setLoading(true);
    fetchWall().then((wallData) => {
      if (wallData) fetchTributes(wallData);
      setLoading(false);
    });
  }, [fetchWall, fetchTributes]);

  const handleLike = async (tributeId: string) => {
    const likedKey = `liked_${tributeId}`;
    if (typeof window !== "undefined" && localStorage.getItem(likedKey)) {
      toast("You already liked this tribute");
      return;
    }
    try {
      const res = await fetch(`/api/walls/${wall!.id}/tributes/${tributeId}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof window !== "undefined") localStorage.setItem(likedKey, "1");
      setTributes((prev) =>
        prev.map((t) => (t.id === tributeId ? { ...t, likes: data.likes } : t))
      );
    } catch {
      // silently fail
    }
  };

  const handleReport = async (tributeId: string, category: string) => {
    try {
      const res = await fetch(`/api/walls/${wall!.id}/tributes/${tributeId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      if (res.status === 429) { toast.error("Too many reports. Please try later."); return; }
      if (!res.ok) throw new Error();
      toast.success("Report submitted. Thank you.");
      setShowReportDialog(null);
    } catch {
      toast.error("Failed to submit report");
    }
  };

  const handleDelete = async (tributeId: string) => {
    if (!confirm("Remove this tribute? This cannot be undone.")) return;
    try {
      const token = await user!.getIdToken();
      await fetch(`/api/walls/${wall!.id}/tributes/${tributeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTributes((prev) => prev.filter((t) => t.id !== tributeId));
      toast.success("Tribute removed");
    } catch {
      toast.error("Failed to remove tribute");
    }
  };

  const handlePin = async (tributeId: string) => {
    if (!wall) return;
    const pinned = wall.pinnedTributeIds || [];
    const newPinned = pinned.includes(tributeId)
      ? pinned.filter((id) => id !== tributeId)
      : [...pinned.slice(0, 2), tributeId];
    try {
      const token = await user!.getIdToken();
      await fetch(`/api/walls/${wall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pinnedTributeIds: newPinned }),
      });
      setWall({ ...wall, pinnedTributeIds: newPinned });
      toast.success(pinned.includes(tributeId) ? "Unpinned" : "Pinned");
    } catch {
      toast.error("Failed to update pin");
    }
  };

  const handleSubmitTribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      if (typeof window !== "undefined") localStorage.setItem("tributeDisplayName", displayName);
      const res = await fetch(`/api/walls/${wall!.id}/tributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, message, mediaUrls: [] }),
      });
      if (res.status === 429) { toast.error("Too many submissions. Please try later."); setSubmitting(false); return; }
      if (!res.ok) throw new Error();
      const tribute = await res.json();
      if (tribute.status === "pending") {
        toast.success("Your tribute has been submitted and is awaiting approval.");
      } else {
        setTributes((prev) => [tribute, ...prev]);
        toast.success("Tribute posted!");
      }
      setMessage("");
      setShowTributeForm(false);
    } catch {
      toast.error("Failed to submit tribute");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(wallUrl);
    toast.success("Link copied!");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (!wall) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Wall not found</h1>
      <Link href="/"><Button variant="outline">Go Home</Button></Link>
    </div>
  );

  const isCelebration = wall.tone === "celebration";
  const sortedTributes = [...tributes].sort((a, b) => {
    const aPinned = (wall.pinnedTributeIds || []).includes(a.id);
    const bPinned = (wall.pinnedTributeIds || []).includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={`min-h-screen ${isCelebration ? "" : "bg-zinc-950"}`}>
      {/* Cover Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
        {wall.coverImageUrl && (
          <img
            src={wall.coverImageUrl}
            alt={wall.title}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-start justify-between">
            <div>
              {wall.locked && (
                <Badge variant="secondary" className="mb-2">
                  <Lock className="w-3 h-3 mr-1" /> Locked
                </Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{wall.title}</h1>
              {wall.description && (
                <p className="mt-2 text-white/80 max-w-xl text-sm md:text-base">{wall.description}</p>
              )}
              <Badge variant="outline" className="mt-2 text-white/60 border-white/20">
                {isCelebration ? "Celebration" : "In Memoriam"}
              </Badge>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowShareDialog(true)}>
              <Share2 className="w-4 h-4 mr-1" /> Share
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="tributes">
          <TabsList className="w-full max-w-xs mx-auto grid grid-cols-2">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="tributes">Tributes</TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="mt-6">
            {wall.galleryItems && wall.galleryItems.length > 0 ? (
              <div className="columns-2 md:columns-3 gap-3 space-y-3">
                {wall.galleryItems.map((item) => (
                  <div key={item.id} className="break-inside-avoid">
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.alt || "Gallery image"}
                        className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxUrl(item.url)}
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full rounded-lg"
                        controls
                        preload="metadata"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No gallery items yet.</p>
                {isCreator && <p className="text-sm mt-1">Add media from your dashboard.</p>}
              </div>
            )}
          </TabsContent>

          {/* Tributes Tab */}
          <TabsContent value="tributes" className="mt-6">
            {/* Leave a Tribute button */}
            {!wall.locked && (
              <div className="mb-6">
                {showTributeForm ? (
                  <form onSubmit={handleSubmitTribute} className="border rounded-xl p-4 space-y-4 bg-card">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Leave a Tribute</h3>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowTributeForm(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="displayName">Your Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                        maxLength={50}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Share your thoughts, memories, or well-wishes..."
                        maxLength={1000}
                        rows={4}
                        required
                      />
                      <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Tribute"}
                    </Button>
                  </form>
                ) : (
                  <Button className="w-full md:w-auto" size="lg" onClick={() => setShowTributeForm(true)}>
                    <Heart className="w-5 h-5 mr-2" /> Leave a Tribute
                  </Button>
                )}
              </div>
            )}

            {wall.locked && (
              <div className="mb-6 p-4 rounded-lg bg-muted text-center text-sm text-muted-foreground">
                <Lock className="w-4 h-4 inline mr-1" /> This wall is no longer accepting tributes.
              </div>
            )}

            {/* Tribute Feed */}
            {sortedTributes.length > 0 ? (
              <div className="space-y-4">
                {sortedTributes.map((tribute) => {
                  const isPinned = (wall.pinnedTributeIds || []).includes(tribute.id);
                  return (
                    <div
                      key={tribute.id}
                      className={`border rounded-xl p-4 bg-card ${isPinned ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                            {tribute.displayName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tribute.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tribute.createdAt).toLocaleDateString(undefined, {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                            </p>
                          </div>
                          {isPinned && <Badge variant="secondary" className="text-xs"><Pin className="w-3 h-3 mr-1" /> Pinned</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          {isCreator && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePin(tribute.id)}>
                                <Pin className={`w-4 h-4 ${isPinned ? "text-primary" : ""}`} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(tribute.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowReportDialog(tribute.id)}>
                            <Flag className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {tribute.message && <p className="mt-3 text-sm whitespace-pre-wrap">{tribute.message}</p>}
                      {tribute.mediaUrls && tribute.mediaUrls.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {tribute.mediaUrls.map((m, i) => (
                            m.type === "image" ? (
                              <img key={i} src={m.url} alt="" className="w-24 h-24 object-cover rounded-md cursor-pointer" onClick={() => setLightboxUrl(m.url)} />
                            ) : (
                              <video key={i} src={m.url} className="w-24 h-24 object-cover rounded-md" controls />
                            )
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-muted-foreground hover:text-red-500"
                          onClick={() => handleLike(tribute.id)}
                        >
                          <Heart className={`w-4 h-4 transition-transform ${typeof window !== "undefined" && localStorage.getItem(`liked_${tribute.id}`) ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                          <span className="text-xs">{tribute.likes}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Be the first to leave a tribute!</p>
                <p className="text-sm mt-1">Share your thoughts, memories, or well-wishes.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this wall</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={wallUrl} readOnly className="flex-1" />
              <Button onClick={copyLink} variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center">
              <QRCodeSVG value={wallUrl} size={160} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out this tribute wall: ${wallUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={`mailto:?subject=${encodeURIComponent(wall.title)}&body=${encodeURIComponent(`Check out this tribute wall: ${wallUrl}`)}`}
                >
                  Email
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={!!showReportDialog} onOpenChange={() => setShowReportDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this tribute</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {["spam", "offensive", "impersonation", "other"].map((cat) => (
              <Button
                key={cat}
                variant="outline"
                onClick={() => showReportDialog && handleReport(showReportDialog, cat)}
                className="capitalize"
              >
                {cat === "offensive" ? "Offensive language" : cat}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
