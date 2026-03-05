import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { TributeStatus } from "@/lib/types";

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  try {
    const { wallId } = await params;
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const wallDoc = await adminDb.collection("walls").doc(wallId).get();
    if (!wallDoc.exists) return NextResponse.json({ error: "Wall not found" }, { status: 404 });

    const wall = wallDoc.data()!;
    if (wall.locked) {
      return NextResponse.json({ error: "Wall is locked" }, { status: 403 });
    }

    const body = await req.json();
    const { displayName, message, mediaUrls } = body;
    if (!displayName) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }
    if (!message && (!mediaUrls || mediaUrls.length === 0)) {
      return NextResponse.json({ error: "Message or media is required" }, { status: 400 });
    }

    const status: TributeStatus = wall.tributePermission === "approval" ? "pending" : "published";
    const tributeRef = adminDb.collection("tributes").doc();
    const tribute = {
      id: tributeRef.id,
      wallId,
      displayName: displayName.slice(0, 50),
      message: (message || "").slice(0, 1000),
      mediaUrls: (mediaUrls || []).slice(0, 3),
      likes: 0,
      reportCount: 0,
      status,
      createdAt: new Date().toISOString(),
    };

    await tributeRef.set(tribute);
    return NextResponse.json(tribute, { status: 201 });
  } catch (error) {
    console.error("Create tribute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  try {
    const { wallId } = await params;
    const showAll = req.nextUrl.searchParams.get("all") === "true";

    let query = adminDb
      .collection("tributes")
      .where("wallId", "==", wallId)
      .orderBy("createdAt", "desc");

    if (!showAll) {
      query = query.where("status", "in", ["published"]);
    }

    const snapshot = await query.get();
    const tributes = snapshot.docs.map((doc) => doc.data());
    return NextResponse.json(tributes);
  } catch (error) {
    console.error("List tributes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
