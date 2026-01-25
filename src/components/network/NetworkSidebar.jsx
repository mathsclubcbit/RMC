"use client";

import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Shield, Target, Users, Activity, LogOut, Grid, X } from "lucide-react";

export default function NetworkSidebar({ profile, onClose }) {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/network/login");
    };

    const handleNav = (href) => {
        router.push(href);
        if (onClose) onClose();
    };

    const navigation = [
        { name: "Dashboard", icon: Grid, href: "/network/dashboard" },
        { name: "Tasks", icon: Target, href: "/network/missions" },
        { name: "Team Members", icon: Users, href: "/network/personnel" },
        // { name: "Analytics", icon: Activity, href: "/network/system" },
    ];

    return (
        <div className="h-full w-64 bg-black border-r border-white/10 p-6 flex flex-col relative">
            <button
                onClick={onClose}
                className="lg:hidden absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-teal/10 border border-teal/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-teal" />
                </div>
                <div>
                    <h2 className="font-[family-name:var(--font-cinzel)] text-white font-bold">RMC NET</h2>
                    <span className="text-[10px] text-teal/50 font-mono uppercase tracking-widest">Internal Link</span>
                </div>
            </div>

            <nav className="space-y-2 flex-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNav(item.href)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wide transition-all ${isActive
                                ? "bg-teal/10 text-teal border border-teal/20"
                                : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </button>
                    )
                })}
            </nav>

            <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xs">
                        {profile?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-white text-sm font-bold truncate">{profile?.full_name || 'Unknown'}</p>
                        <p className="text-[10px] text-white/40 uppercase font-mono">{profile?.role || 'Guest'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-white/10 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors uppercase font-mono"
                >
                    <LogOut className="w-3 h-3" /> Logout
                </button>
            </div>
        </div>
    );
}
