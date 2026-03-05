import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const RATE_LIMIT_WINDOW = 300_000;
const RATE_LIMIT_MAX = 3;
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
    const { wallId, tributeId } = await params;
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many reports" }, { status: 429 });
    }

    const body = await req.json();
    const { category } = body;
    const validCategories = ["spam", "offensive", "impersonation", "other"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const reportRef = adminDb.collection("reports").doc();
    await reportRef.set({
      id: reportRef.id,
      tributeId,
      wallId,
      category,
      createdAt: new Date().toISOString(),
    });

    // Increment report count on tribute
    const tributeRef = adminDb.collection("tributes").doc(tributeId);
    await tributeRef.update({ reportCount: FieldValue.increment(1) });

    // Auto-hide if 3+ reports
    const tribute = await tributeRef.get();
    if (tribute.exists && tribute.data()!.reportCount >= 3 && tribute.data()!.status === "published") {
      await tributeRef.update({ status: "hidden" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report tribute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
