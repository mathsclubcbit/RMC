"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    Users,
    UserCog,
    Calendar,
    ListTodo,
    FolderOpen,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
    X,
    ExternalLink
} from "lucide-react";

export default function NetworkSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { profile, signOut, isPresident, canManageTeams, canManageMembers } = useAuth();

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const handleSignOut = async () => {
        await signOut();
        router.push("/network/login");
    };

    // Build navigation links based on role and permissions
    const getNavLinks = () => {
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
        links.push({ href: "/network/calendar", label: "Calendar", icon: Calendar, always: true });

        // Tasks - Everyone
        links.push({ href: "/network/tasks", label: "Tasks", icon: ListTodo, always: true });

        // Resources - Everyone
        links.push({ href: "/network/resources", label: "Resources", icon: FolderOpen, always: true });

        // Settings - President only
        if (isPresident()) {
            links.push({ href: "/network/settings", label: "Settings", icon: Settings });
        }

        return links;
    };

    const navLinks = getNavLinks();

    const NavContent = () => (
        <>
            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-6 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
                <Image
                    src="/RMC logo-circular.png"
                    alt="RMC"
                    width={collapsed ? 36 : 40}
                    height={collapsed ? 36 : 40}
                    className="flex-shrink-0"
                />
                {!collapsed && (
                    <div>
                        <h1 className="text-white font-serif font-bold text-lg">RMC Network</h1>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest">{profile?.role?.replace('_', ' ')}</p>
                    </div>
                )}
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive
                                ? 'bg-teal/10 text-teal'
                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                } ${collapsed ? 'justify-center' : ''}`}
                        >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-teal' : 'group-hover:text-teal'}`} />
                            {!collapsed && (
                                <span className="text-sm font-medium">{link.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User & Actions */}
            <div className="px-3 py-4 border-t border-white/5 space-y-1">
                {!collapsed && (
                    <div className="px-3 py-2 mb-2">
                        <p className="text-white text-sm font-medium truncate">{profile?.full_name || profile?.email}</p>
                        <p className="text-white/40 text-xs truncate">{profile?.email}</p>
                    </div>
                )}

                {/* Exit to Main Website */}
                <Link
                    href="/"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all w-full ${collapsed ? 'justify-center' : ''}`}
                >
                    <ExternalLink className="w-5 h-5" />
                    {!collapsed && <span className="text-sm font-medium">Exit to Website</span>}
                </Link>

                {/* Sign Out */}
                <button
                    onClick={handleSignOut}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all w-full ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-white"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gray-900/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col"
                    >
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <NavContent />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col bg-gray-900/60 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                <NavContent />

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 p-1.5 bg-gray-800 border border-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            </aside>
        </>
    );
}
