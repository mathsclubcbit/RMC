import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getSecret } from "@/lib/jwt";

const STORAGE_BUCKET = "event-images";

export async function POST(request) {
    try {
        // Verify admin
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            await jwtVerify(token, getSecret());
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
        }

        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }

        // Generate unique filename
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `hub/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const supabase = createAdminClient();

        // Upload to Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

        return NextResponse.json({ url: urlData.publicUrl });
    } catch (error) {
        console.error("Hub upload error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
