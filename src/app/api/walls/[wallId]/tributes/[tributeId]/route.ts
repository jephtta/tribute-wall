import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ wallId: string; tributeId: string }> }
) {
  try {
    const { wallId, tributeId } = await params;
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const wallDoc = await adminDb.collection("walls").doc(wallId).get();
    if (!wallDoc.exists) return NextResponse.json({ error: "Wall not found" }, { status: 404 });
    if (wallDoc.data()!.creatorId !== decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const validStatuses = ["published", "pending", "rejected", "hidden"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await adminDb.collection("tributes").doc(tributeId).update(updates);
    const updated = await adminDb.collection("tributes").doc(tributeId).get();
    return NextResponse.json(updated.data());
  } catch (error) {
    console.error("Update tribute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ wallId: string; tributeId: string }> }
) {
  try {
    const { wallId, tributeId } = await params;
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const wallDoc = await adminDb.collection("walls").doc(wallId).get();
    if (!wallDoc.exists) return NextResponse.json({ error: "Wall not found" }, { status: 404 });
    if (wallDoc.data()!.creatorId !== decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await adminDb.collection("tributes").doc(tributeId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tribute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
