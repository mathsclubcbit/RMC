"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Swords, Trophy, User, Crown, ChevronRight } from "lucide-react";

export default function PlacementSeriesNav({ eventId, eventTitle }) {
    const pathname = usePathname();

    const navItems = [
        { href: `/placement-series/${eventId}`, label: "Daily", icon: CalendarDays },
        { href: `/placement-series/${eventId}/contests`, label: "Contests", icon: Swords },
        { href: `/placement-series/${eventId}/winners`, label: "Winners", icon: Crown },
        { href: `/placement-series/${eventId}/leaderboard`, label: "Ranks", icon: Trophy },
        { href: `/placement-series/${eventId}/profile`, label: "Profile", icon: User },
    ];

    return (
        <>
            {/* ── Desktop Navigation ─────────────────────────────────────── */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto w-full px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
                        <span className="text-sm font-bold text-white tracking-widest uppercase">Placement Series</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.label === "Contests" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        isActive
                                            ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
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
                    </div>
                </div>
            </nav>

            {/* Mobile Top Premium Nav */}
            <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-3xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                {/* Brand Row */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)] animate-pulse" />
                        <span className="text-[10px] font-black text-white tracking-widest uppercase">{eventTitle || "Placement Series"}</span>
                    </div>
                </div>

                {/* Chips Navigation Row */}
                <div className="relative">
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none z-10 flex items-center justify-end pr-2">
                        <ChevronRight className="w-4 h-4 text-white/30 animate-pulse" />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all flex-shrink-0 bg-white/5 border border-white/5 text-white/50 active:bg-white/10 active:text-white"
                        >
                            <Home className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Site</span>
                        </Link>

                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.label === "Contests" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all flex-shrink-0 border ${
                                        isActive 
                                            ? "bg-teal-500/10 text-teal-400 border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.15)]" 
                                            : "bg-white/5 border-white/5 text-white/50 active:bg-white/10 active:text-white"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 transition-all ${isActive ? "drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]" : ""}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </>
    );
}
