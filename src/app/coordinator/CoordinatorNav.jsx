"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, QrCode, Edit3, LogOut, Home, ChevronRight, Users, Database, CalendarDays, Swords, Trophy, Medal, Camera, HelpCircle } from "lucide-react";
import { useLoading } from "@/context/LoadingContext";

const baseNavItems = [
    { href: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/coordinator/participants", label: "Participants", icon: Users },
    { href: "/coordinator/scan", label: "Scan", icon: QrCode },
    { href: "/coordinator/edit", label: "Edit", icon: Edit3 },
];

const psNavItems = [
    { href: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/coordinator/questions", label: "Q-Bank", icon: Database },
    { href: "/coordinator/daily", label: "Daily Qs", icon: CalendarDays },
    { href: "/coordinator/story", label: "Story", icon: Camera },
    { href: "/coordinator/contests", label: "Contests", icon: Swords },
    { href: "/coordinator/leaderboard", label: "Ranks", icon: Trophy },
];

const quizNavItems = [
    { href: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/coordinator/quiz/questions", label: "Q-Bank", icon: Database },
    { href: "/coordinator/quiz/sessions", label: "Sessions", icon: Users },
    { href: "/coordinator/quiz/leaderboard", label: "Ranks", icon: Trophy },
];

export default function CoordinatorNav({ eventTitle, eventType }) {
    const pathname = usePathname();
    const { startLoading } = useLoading();
    
    const navItems = eventType === 'Placement Series' ? psNavItems : eventType === 'Quiz' ? quizNavItems : baseNavItems;

    const handleLogout = async () => {
        try {
            await fetch("/api/coordinator/logout", { method: "POST" });
            window.location.href = "/coordinator/login";
        } catch {
            window.location.href = "/coordinator/login";
        }
    };

    return (
        <>
            {/* Desktop/Tablet Header Navigation */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto w-full px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
                            <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Coordinator</span>
                        </div>
                        {eventTitle && (
                            <span className="text-sm font-semibold text-white/80 truncate max-w-[200px]">
                                {eventTitle}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.label === "Scan" && pathname.startsWith("/coordinator/ticket/"));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                        if (pathname !== item.href) startLoading();
                                    }}
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

                        <div className="w-px h-6 bg-white/10 mx-2" /> {/* Divider */}

                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <Home className="w-4 h-4" />
                            Site
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Floating Dock */}
            <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/50 safe-area-inset-bottom overflow-hidden group">
                {/* Scroll Indicator Gradient - Only show if content overflows (checked via CSS assumption or always show as hint) */}
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none z-10 flex items-center justify-end pr-1">
                    <ChevronRight className="w-4 h-4 text-white/50 animate-pulse" />
                </div>
                <div className="flex items-center gap-8 overflow-x-auto py-2 px-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', justifyContent: navItems.length < 4 ? 'center' : 'flex-start' }}>
                    <Link
                        href="/"
                        className="flex flex-col items-center gap-1 transition-all text-white/50 active:text-white relative flex-shrink-0"
                    >
                        <div className="p-2 rounded-xl">
                            <Home className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-medium uppercase tracking-widest">Site</span>
                    </Link>

                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.label === "Scan" && pathname.startsWith("/coordinator/ticket/"));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 transition-all relative flex-shrink-0 ${isActive
                                    ? "text-teal-400"
                                    : "text-white/50 active:text-white"
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
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center gap-1 transition-all text-red-400/70 active:text-red-400 relative flex-shrink-0"
                    >
                        <div className="p-2 rounded-xl">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-medium uppercase tracking-widest">Exit</span>
                    </button>
                </div>
            </nav>

            {/* Spacers for fixed navigation */}
            <div className="hidden md:block h-16" /> {/* Top spacer for desktop */}
        </>
    );
}
