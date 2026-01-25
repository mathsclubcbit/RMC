"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Shield, Target, Users, Activity, LogOut, Grid, X, Bell } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NetworkSidebar({ profile, onClose }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isSubscribed, subscribeToNotifications, loading: subLoading } = usePushNotifications();

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
    ].filter(item => {
        if (profile?.role === 'faculty' && item.name === 'Tasks') return false;
        return true;
    });

    return (
        <div className="h-full w-64 bg-black border-r border-white/10 p-6 flex flex-col relative">
            <button
                onClick={onClose}
                className="lg:hidden absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-teal/10 border border-teal/20 rounded-xl flex items-center justify-center p-1.5 relative">
                    <Image
                        src="/RMC logo-circular.png"
                        alt="RMC Logo"
                        fill
                        className="object-contain p-1"
                        sizes="(max-width: 768px) 32px, 40px"
                    />
                </div>
                <div>
                    <h2 className="font-[family-name:var(--font-cinzel)] text-white font-bold uppercase tracking-wider">RMC Hub</h2>
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

            {/* Notification Toggle */}
            <div className="py-2">
                <button
                    onClick={subscribeToNotifications}
                    disabled={isSubscribed || subLoading}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wide transition-all border ${isSubscribed
                        ? "bg-green-500/10 text-green-500 border-green-500/20 opacity-50 cursor-default"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
                        }`}
                >
                    <Bell className={`w-4 h-4 ${subLoading ? 'animate-pulse' : ''}`} />
                    {subLoading ? 'Checking...' : isSubscribed ? 'Notifications On' : 'Enable Updates'}
                </button>
            </div>

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
                    onClick={() => router.push('/')}
                    className="w-full flex items-center justify-center gap-2 py-2 mb-2 border border-white/5 rounded-lg text-[10px] text-white/40 hover:text-teal hover:bg-white/5 transition-all uppercase font-mono tracking-widest"
                >
                    <Grid className="w-3 h-3" /> Main Website
                </button>
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
