"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, LogOut, ExternalLink } from "lucide-react";
import type { Wall } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [walls, setWalls] = useState<Wall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/signin"); return; }

    const fetchWalls = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/walls", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setWalls(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchWalls();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">Tribute Wall</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Walls</h1>
          <Link href="/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New Wall
            </Button>
          </Link>
        </div>

        {walls.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground mb-4">You haven&apos;t created any walls yet.</p>
              <Link href="/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Wall
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {walls.map((wall) => (
              <Link key={wall.id} href={`/dashboard/${wall.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">{wall.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={wall.tone === "celebration" ? "default" : "secondary"}>
                        {wall.tone === "celebration" ? "Celebration" : "Memorial"}
                      </Badge>
                      {wall.locked && <Badge variant="outline">Locked</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {wall.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link
                          href={`/for/${wall.slug}`}
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" /> View
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
