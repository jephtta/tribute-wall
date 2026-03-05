import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;
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
  { params }: { params: Promise<{ wallId: string; tributeId: string }> }
) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { tributeId } = await params;
    const tributeRef = adminDb.collection("tributes").doc(tributeId);
    const doc = await tributeRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Tribute not found" }, { status: 404 });
    }

    await tributeRef.update({ likes: FieldValue.increment(1) });
    const updated = await tributeRef.get();
    return NextResponse.json({ likes: updated.data()!.likes });
  } catch (error) {
    console.error("Like tribute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
