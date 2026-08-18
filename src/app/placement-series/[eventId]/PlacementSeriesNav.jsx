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
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-[#090d16]/90 backdrop-blur-xl border-b border-white/10 transition-all duration-300 shadow-lg shadow-black/40">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 group cursor-pointer">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)] animate-pulse" />
                        <span className="text-sm font-extrabold text-white tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 group-hover:from-teal-300 group-hover:to-emerald-300 transition-all">
                            Placement Series
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 lg:gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.label === "Contests" && pathname?.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-200 min-h-[40px] ${
                                        isActive
                                            ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_15px_rgba(45,212,191,0.2)] scale-[1.02]"
                                            : "text-white/60 hover:text-white hover:bg-white/10 hover:border-white/10 border border-transparent hover:scale-[1.01]"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 transition-transform ${isActive ? "scale-110 drop-shadow-[0_0_6px_rgba(45,212,191,0.8)]" : ""}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        <div className="w-px h-6 bg-white/10 mx-2" />

                        <Link
                            href="/"
                            className="flex items-center gap-2 px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-200 hover:scale-[1.01] min-h-[40px]"
                        >
                            <Home className="w-4 h-4" />
                            Site
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Mobile Top Premium Nav ──────────────────────────────────── */}
            <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#090d16]/95 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all">
                {/* Brand Row */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)] animate-pulse" />
                        <span className="text-xs font-black text-white tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">
                            {eventTitle || "Placement Series"}
                        </span>
                    </div>
                </div>

                {/* Chips Navigation Row */}
                <div className="relative">
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#090d16] to-transparent pointer-events-none z-10 flex items-center justify-end pr-1">
                        <ChevronRight className="w-4 h-4 text-white/40 animate-pulse" />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all flex-shrink-0 bg-white/5 border border-white/10 text-white/60 active:bg-white/15 active:text-white active:scale-95 text-xs font-bold uppercase tracking-wider min-h-[38px]"
                        >
                            <Home className="w-3.5 h-3.5" />
                            <span>Site</span>
                        </Link>

                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.label === "Contests" && pathname?.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all flex-shrink-0 border text-xs font-bold uppercase tracking-wider min-h-[38px] active:scale-95 ${
                                        isActive 
                                            ? "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-[0_0_14px_rgba(45,212,191,0.25)]" 
                                            : "bg-white/5 border-white/10 text-white/60 active:bg-white/15 active:text-white"
                                    }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 transition-all ${isActive ? "drop-shadow-[0_0_8px_rgba(45,212,191,0.8)] text-teal-400" : ""}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </>
    );
}

