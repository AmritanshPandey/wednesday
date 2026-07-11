import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { R2_BUCKET, R2_PUBLIC_URL, isR2Configured, r2Client } from "@/lib/storage/r2";
import { uidFromRequest } from "@/lib/server/data";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Returns a short-lived presigned PUT URL so the client can upload a profile
 *  photo straight to Cloudflare R2, plus the public URL it will live at. */
export async function POST(req: Request) {
  if (!isR2Configured) return NextResponse.json({ error: "storage not configured" }, { status: 503 });

  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { contentType, slot } = (await req.json()) as { contentType: string; slot?: string };
  if (!ALLOWED.has(contentType)) return NextResponse.json({ error: "unsupported type" }, { status: 400 });

  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const safeSlot = (slot ?? "main").replace(/[^a-z0-9-]/gi, "").slice(0, 16) || "main";
  const key = `profiles/${uid}/${safeSlot}-${Date.now()}.${ext}`;

  const url = await getSignedUrl(
    r2Client(),
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );

  const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}` : "";
  return NextResponse.json({ uploadUrl: url, publicUrl, key });
}
