import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { email, name } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. Check if already exists
        const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return NextResponse.json({ message: "Already subscribed" }); // Soft success
        }

        // 2. Insert into DB
        const { error: insertError } = await supabase
            .from('newsletter_subscribers')
            .insert([{
                email,
                name: name || 'Visionary',
                is_active: true
            }]);

        if (insertError) {
            console.error("DB Error:", insertError);
            return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
        }

        // 3. Send Welcome Email (Non-blocking usually, but await here for simplicity in V1)
        await sendWelcomeEmail(email, name);

        return NextResponse.json({ success: true, message: "Welcome to the Inner Circle" });

    } catch (error) {
        console.error("Subscribe API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
