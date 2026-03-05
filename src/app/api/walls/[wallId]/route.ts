import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  try {
    const { wallId } = await params;

    // Try by ID first, then by slug
    let doc = await adminDb.collection("walls").doc(wallId).get();
    if (!doc.exists) {
      const snapshot = await adminDb
        .collection("walls")
        .where("slug", "==", wallId)
        .limit(1)
        .get();
      if (snapshot.empty) {
        return NextResponse.json({ error: "Wall not found" }, { status: 404 });
      }
      doc = snapshot.docs[0];
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    console.error("Get wall error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  try {
    const { wallId } = await params;
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const doc = await adminDb.collection("walls").doc(wallId).get();
    if (!doc.exists) return NextResponse.json({ error: "Wall not found" }, { status: 404 });

    const wall = doc.data()!;
    if (wall.creatorId !== decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields = [
      "title", "description", "coverImageUrl", "tone",
      "tributePermission", "locked", "pinnedTributeIds", "galleryItems",
    ];
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    await adminDb.collection("walls").doc(wallId).update(updates);
    return NextResponse.json({ ...wall, ...updates });
  } catch (error) {
    console.error("Update wall error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  try {
    const { wallId } = await params;
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const doc = await adminDb.collection("walls").doc(wallId).get();
    if (!doc.exists) return NextResponse.json({ error: "Wall not found" }, { status: 404 });

    if (doc.data()!.creatorId !== decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete all tributes
    const tributes = await adminDb.collection("tributes").where("wallId", "==", wallId).get();
    const batch = adminDb.batch();
    tributes.docs.forEach((t) => batch.delete(t.ref));
    batch.delete(doc.ref);
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete wall error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
