"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";
import {
    LayoutDashboard,
    Users,
    UserCog,
    Calendar as CalendarIcon,
    ListTodo,
    FolderOpen,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
    X,
    ExternalLink,
    RefreshCw
} from "lucide-react";

function NavContent({
    hideLogo = false,
    collapsed,
    profile,
    navLinks,
    pathname,
    handleSignOut,
    windowReload,
    startLoading
}) {
    return (
        <>
            {/* Logo */}
            {!hideLogo && (
                <div className={`flex items-center gap-3 px-6 py-8 border-b border-white/5 ${collapsed ? 'justify-center border-none' : ''}`}>
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-teal/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                        <Image
                            src="/full logo.png"
                            alt="RMC"
                            width={collapsed ? 36 : 42}
                            height={collapsed ? 36 : 42}
                            className="relative z-10 rounded-full filter drop-shadow-[0_0_8px_rgba(45,212,191,0.3)]"
                        />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-white font-[family-name:var(--font-cinzel)] font-bold text-lg tracking-tighter">RMC <span className="text-teal">NETWORK</span></h1>
                            <p className="text-white/30 text-[9px] uppercase tracking-[0.2em] font-mono mt-0.5">{profile?.role?.replace('_', ' ')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Nav Links */}
            <nav className="flex-1 px-4 py-8 space-y-2">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => {
                                if (!isActive) startLoading();
                            }}
                            className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 relative group overflow-hidden ${isActive
                                ? 'text-teal shadow-[0_0_20px_rgba(45,212,191,0.1)]'
                                : 'text-white/40 hover:text-white'
                                } ${collapsed ? 'justify-center' : ''}`}
                        >
                            {/* Active/Hover Glow Surface */}
                            <div className={`absolute inset-0 bg-gradient-to-r from-teal/10 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal rounded-r-full shadow-[0_0_15px_rgba(45,212,191,0.5)]" />}

                            <Icon className={`w-5 h-5 relative z-10 transition-transform duration-500 ${isActive ? 'text-teal scale-110' : 'group-hover:text-teal group-hover:scale-110'}`} />
                            {!collapsed && (
                                <span className={`text-sm font-medium relative z-10 ${isActive ? 'font-semibold' : ''}`}>
                                    {link.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User & Actions */}
            <div className="px-4 py-6 border-t border-white/5 space-y-2">
                {!collapsed && (
                    <div className="px-4 py-3 mb-2 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-white text-sm font-[family-name:var(--font-cormorant)] font-semibold truncate tracking-wide">{profile?.full_name || profile?.email}</p>
                        <p className="text-white/30 text-[10px] truncate font-mono tracking-tighter">{profile?.email}</p>
                    </div>
                )}

                {/* Combined Actions Container */}
                <div className="space-y-1">
                    <button
                        onClick={windowReload}
                        className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-white/30 hover:bg-white/5 hover:text-white transition-all w-full group ${collapsed ? 'justify-center' : ''}`}
                    >
                        <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
                        {!collapsed && <span className="text-xs font-medium">Refresh Sync</span>}
                    </button>

                    <Link
                        href="/"
                        className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-white/30 hover:bg-white/5 hover:text-white transition-all w-full group ${collapsed ? 'justify-center' : ''}`}
                    >
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        {!collapsed && <span className="text-xs font-medium">Public Website</span>}
                    </Link>

                    <button
                        onClick={handleSignOut}
                        className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-red-400/50 hover:bg-red-500/10 hover:text-red-400 transition-all w-full group ${collapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        {!collapsed && <span className="text-xs font-medium">End Session</span>}
                    </button>
                </div>
            </div>
        </>
    );
}

export default function NetworkSidebar() {
    if (typeof window === 'undefined') return null;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { profile, signOut, isPresident, canManageTeams, canManageMembers } = useAuth();

    // Close mobile menu on route change
    useEffect(() => {
        if (mobileOpen) {
            const timer = setTimeout(() => setMobileOpen(false), 0);
            return () => clearTimeout(timer);
        }
    }, [pathname, mobileOpen]);

    function getNavLinks() {
        const links = [
            { href: "/network/dashboard", label: "Dashboard", icon: LayoutDashboard, always: true },
        ];

        // Teams link - visible to all, but admin functions only for authorized users
        if (isPresident() || canManageTeams()) {
            links.push({ href: "/network/teams", label: "Teams", icon: Users });
        }

        // Personnel - President and delegated only
        if (isPresident() || canManageMembers()) {
            links.push({ href: "/network/personnel", label: "Personnel", icon: UserCog });
        }

        // My Team - For heads and members
        if (profile?.role === "head" || profile?.role === "member") {
            links.push({ href: "/network/my-team", label: "My Team", icon: Users });
        }

        // Calendar - Everyone
        links.push({ href: "/network/calendar", label: "Calendar", icon: CalendarIcon, always: true });

        // Tasks - Everyone
        links.push({ href: "/network/tasks", label: "Tasks", icon: ListTodo, always: true });

        // Resources - Everyone
        links.push({ href: "/network/resources", label: "Resources", icon: FolderOpen, always: true });

        // Settings - President only
        if (isPresident()) {
            links.push({ href: "/network/settings", label: "Settings", icon: Settings });
        }

        return links;
    }

    const navLinks = getNavLinks();

    async function handleSignOut() {
        await signOut();
        router.push("/network/login");
    }

    function windowReload() {
        if (typeof window !== 'undefined') window.location.reload();
    }

    const { startLoading } = useLoading();
    const commonProps = {
        collapsed,
        profile,
        navLinks,
        pathname,
        handleSignOut,
        windowReload,
        startLoading
    };

    return (
        <>
            {/* Mobile Header Bar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 z-40 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Image
                        src="/full logo.png"
                        alt="RMC"
                        width={32}
                        height={32}
                        className="rounded-full"
                    />
                    <div>
                        <h1 className="text-white font-serif font-bold text-sm leading-none">RMC Network</h1>
                        <p className="text-white/40 text-[8px] uppercase tracking-widest mt-0.5">{profile?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        console.log("Mobile menu clicked");
                        setMobileOpen(true);
                    }}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white relative z-50"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </header>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-30"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="lg:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#020617] border-r border-white/5 z-40 flex flex-col shadow-2xl"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                            <h2 className="text-white font-serif font-bold text-lg">Navigation</h2>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <NavContent {...commonProps} hideLogo={true} />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col bg-white/[0.01] backdrop-blur-[30px] border-r border-white/5 transition-all duration-500 relative ${collapsed ? 'w-24' : 'w-72'
                    }`}
            >
                <div className="flex flex-col h-full sticky top-0">
                    <NavContent {...commonProps} />

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="absolute -right-3 top-24 p-2 bg-black border border-white/10 rounded-full text-white/30 hover:text-teal hover:border-teal/30 hover:shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-all z-10"
                    >
                        <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Bottom Aesthetic Accent */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal/20 to-transparent" />
                </div>
            </aside>
        </>
    );
}
