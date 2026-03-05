import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { nanoid } from "nanoid";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_CREATOR_IMAGE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_CREATOR_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;
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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const context = formData.get("context") as string | null; // "gallery" or "tribute" or "cover"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const isCreatorUpload = context === "gallery" || context === "cover";
    const maxSize = isVideo
      ? (isCreatorUpload ? MAX_CREATOR_VIDEO_SIZE : MAX_VIDEO_SIZE)
      : (isCreatorUpload ? MAX_CREATOR_IMAGE_SIZE : MAX_IMAGE_SIZE);

    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "bin";
    const filename = `${context || "upload"}/${nanoid()}.${ext}`;
    const bucket = adminStorage.bucket();
    const blob = bucket.file(filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await blob.save(buffer, {
      metadata: { contentType: file.type },
    });
    await blob.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    return NextResponse.json({
      url,
      type: isImage ? "image" : "video",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
