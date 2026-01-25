"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NetworkPage() {
    const router = useRouter();

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.replace("/network/dashboard");
            } else {
                router.replace("/network/login");
            }
        };
        checkStatus();
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-teal/20 border-t-teal rounded-full animate-spin" />
                <div className="text-teal font-mono text-[10px] uppercase tracking-widest animate-pulse">Initializing RMC Hub...</div>
            </div>
        </div>
    );
}
