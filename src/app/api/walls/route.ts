import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { generateSlug } from "@/lib/slug";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();

    const { title, description, coverImageUrl, tone, tributePermission } = body;
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const slug = generateSlug(title);
    const wallRef = adminDb.collection("walls").doc();
    const wall = {
      id: wallRef.id,
      slug,
      title,
      description: description || "",
      coverImageUrl: coverImageUrl || "",
      tone: tone || "celebration",
      tributePermission: tributePermission || "open",
      creatorId: decoded.uid,
      locked: false,
      pinnedTributeIds: [],
      galleryItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await wallRef.set(wall);
    return NextResponse.json(wall, { status: 201 });
  } catch (error) {
    console.error("Create wall error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const snapshot = await adminDb
      .collection("walls")
      .where("creatorId", "==", decoded.uid)
      .orderBy("createdAt", "desc")
      .get();

    const walls = snapshot.docs.map((doc) => doc.data());
    return NextResponse.json(walls);
  } catch (error) {
    console.error("List walls error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
