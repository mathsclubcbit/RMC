"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Swords, Trophy, User, ChevronRight } from "lucide-react";

export default function PlacementSeriesNav({ eventId, eventTitle }) {
    const pathname = usePathname();

    const navItems = [
        { href: `/placement-series/${eventId}`, label: "Daily", icon: CalendarDays },
        { href: `/placement-series/${eventId}/contests`, label: "Contests", icon: Swords },
        { href: `/placement-series/${eventId}/leaderboard`, label: "Ranks", icon: Trophy },
        { href: `/placement-series/${eventId}/profile`, label: "Profile", icon: User },
    ];

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto w-full px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
                            <span className="text-sm font-bold text-white tracking-widest uppercase">Placement Series</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.label === "Contests" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive
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

            {/* Mobile Dock */}
            <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex items-center justify-between px-6 py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.label === "Contests" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-all relative ${isActive
                                ? "text-teal-400"
                                : "text-white/50"
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-teal-400/10" : ""}`}>
                                <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]" : ""}`} />
                            </div>
                            <span className="text-[9px] font-medium uppercase tracking-widest">{item.label}</span>
                            {isActive && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-teal-400" />}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
