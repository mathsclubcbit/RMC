import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getSecret } from "@/lib/jwt";

// GET - Fetch hub data (public)
export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "hub")
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Hub fetch error:", error);
            return NextResponse.json({ categories: [] });
        }

        return NextResponse.json(data?.value || { categories: [] });
    } catch (error) {
        console.error("Hub GET error:", error);
        return NextResponse.json({ categories: [] });
    }
}

// PUT - Update hub data (admin only)
export async function PUT(request) {
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

        const body = await request.json();
        const { categories } = body;

        if (!Array.isArray(categories)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Upsert the hub settings
        const { error } = await supabase
            .from("settings")
            .upsert(
                { key: "hub", value: { categories } },
                { onConflict: "key" }
            );

        if (error) {
            console.error("Hub save error:", error);
            return NextResponse.json({ error: "Failed to save" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Hub PUT error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
