"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NetworkSidebar from "@/components/network/NetworkSidebar";
import { Shield } from "lucide-react";

export default function NetworkLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                if (pathname !== '/network/login') {
                    router.push('/network/login');
                }
                setLoading(false);
                return;
            }

            // Fetch Profile Once
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
            } else {
                setProfile({
                    full_name: user.user_metadata.full_name,
                    role: user.user_metadata.role || 'member',
                    team: user.user_metadata.team || 'council'
                });
            }
            setLoading(false);
        };

        checkAuth();
    }, [router, pathname]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
                    <div className="text-teal font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Loading Project Dashboard</div>
                </div>
            </div>
        );
    }

    if (pathname === '/network/login') return children;

    return (
        <div className="min-h-screen bg-black">
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-white/10 flex items-center justify-between px-6 z-30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal/10 border border-teal/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-teal" />
                    </div>
                    <span className="font-[family-name:var(--font-cinzel)] text-white font-bold text-sm tracking-widest">RMC NET</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-white/60 hover:text-teal transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>
            </div>

            {/* Sidebar with Drawer Logic */}
            <div
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <NetworkSidebar profile={profile} onClose={() => setIsSidebarOpen(false)} />
            </div>

            <main className="lg:pl-64 min-h-screen pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    );
}
