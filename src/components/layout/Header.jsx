"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import NotificationManager from "@/components/notifications/NotificationManager";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/events", label: "Events" },
    { href: "/team", label: "Team" },
    { href: "/gallery", label: "Gallery" },
];

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 transition-all duration-300 backdrop-blur-md bg-black/50 border-b border-white/5" role="banner">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-4 group" aria-label="RMC Home">
                        <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-white/10 bg-black/20 shadow-[0_0_12px_rgba(45,212,191,0.15)]">
                            <Image
                                src="/full logo.png"
                                alt="RMC Logo"
                                width={40}
                                height={40}
                                className="rounded-lg object-cover group-hover:rotate-12 transition-transform duration-500"
                                priority
                            />
                        </div>
                        <span className="font-sans font-bold text-xl tracking-[0.25em] text-white group-hover:text-teal transition-colors duration-300">
                            RMC
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-2" role="navigation" aria-label="Main navigation">
                        {navLinks.map((link, index) => {
                            const isLast = index === navLinks.length - 1;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`
                                        relative px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 group overflow-hidden
                                        ${isLast
                                            ? "bg-teal/10 text-teal hover:bg-teal hover:text-black border border-teal/20"
                                            : "text-foreground/70 hover:text-white hover:bg-white/5"
                                        }
                                    `}
                                    aria-label={`Navigate to ${link.label}`}
                                >
                                    <span className="relative z-10">{link.label}</span>
                                    {!isLast && <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
                                </Link>
                            );
                        })}
                        <div className="pl-2 border-l border-white/10 ml-2">
                            <NotificationManager />
                        </div>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        <svg
                            className="w-6 h-6 text-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            {isMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <nav
                        id="mobile-menu"
                        className="md:hidden py-4 border-t border-white/10"
                        role="navigation"
                        aria-label="Mobile navigation"
                    >
                        <div className="flex flex-col gap-2">
                            {navLinks.map((link, index) => {
                                const isLast = index === navLinks.length - 1;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-4 py-3 rounded-lg transition-all ${isLast
                                            ? "bg-teal/10 text-teal border border-teal/20 font-bold"
                                            : "text-foreground/80 hover:text-teal hover:bg-teal/10"
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                        aria-label={`Navigate to ${link.label}`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}

                            <div className="px-4 py-3 flex items-center justify-between text-foreground/80">
                                <span className="text-sm font-medium">Notifications</span>
                                <NotificationManager />
                            </div>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}
