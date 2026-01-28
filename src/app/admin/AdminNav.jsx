"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, QrCode, Home, LogOut, Image as ImageIcon, Users, Bell } from "lucide-react";
import { adminLogoutAction } from "./actions";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/events", label: "Events", icon: Calendar },
    { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/admin/team", label: "Team", icon: Users },
    { href: "/admin/announcements", label: "Notify", icon: Bell },
    { href: "/admin/scan", label: "Scan", icon: QrCode },
];

export default function AdminNav() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop/Tablet Header Navigation */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto w-full px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
                            <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Admin Console</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.label === "Events" && pathname.startsWith("/admin/events")) || (item.label === "Scan" && pathname.startsWith("/admin/ticket"));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                        : "text-white/60 hover:text-white hover:bg-white/10"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}

                        <div className="w-px h-6 bg-white/10 mx-2" />

                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <Home className="w-4 h-4" />
                            Site
                        </Link>

                        <form action={adminLogoutAction}>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </form>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Floating Dock */}
            <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/50 safe-area-inset-bottom">
                <div className="flex items-center justify-around py-3 px-2">
                    <Link
                        href="/"
                        className="flex flex-col items-center gap-1 transition-all text-white/50 active:text-white relative"
                    >
                        <div className="p-2 rounded-xl">
                            <Home className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-medium uppercase tracking-widest">Site</span>
                    </Link>

                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.label === "Events" && pathname.startsWith("/admin/events")) || (item.label === "Scan" && pathname.startsWith("/admin/ticket"));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 transition-all relative ${isActive
                                    ? "text-indigo-400"
                                    : "text-white/50 active:text-white"
                                    }`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-indigo-500/10" : ""}`}>
                                    <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" : ""}`} />
                                </div>
                                <span className="text-[9px] font-medium uppercase tracking-widest">{item.label}</span>
                                {isActive && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-500" />}
                            </Link>
                        );
                    })}

                    <form action={adminLogoutAction}>
                        <button
                            className="flex flex-col items-center gap-1 transition-all text-red-400/70 active:text-red-400 relative"
                        >
                            <div className="p-2 rounded-xl">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-medium uppercase tracking-widest">Exit</span>
                        </button>
                    </form>
                </div>
            </nav>

            {/* Spacers */}
            <div className="hidden md:block h-16" />
            <div className="md:hidden h-28" />
        </>
    );
}
