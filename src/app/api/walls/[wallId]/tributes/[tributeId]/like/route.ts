import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ wallId: string; tributeId: string }> }
) {
  try {
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
