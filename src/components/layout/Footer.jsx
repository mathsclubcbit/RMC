"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const quickLinks = [
    { href: "/about", label: "About Us" },
    { href: "/events", label: "Events" },
    { href: "/team", label: "Our Team" },
    { href: "/gallery", label: "Gallery" },
];

const resourceLinks = [
    { href: "/resources", label: "Math Resources" },
    { href: "/resources#puzzles", label: "Puzzles" },
    { href: "/resources#books", label: "Recommended Books" },
];

const socialLinks = [
    { href: "https://instagram.com/rmccbit", label: "Instagram", icon: "📸" },
    { href: "https://linkedin.com/company/rmccbit", label: "LinkedIn", icon: "💼" },
    { href: "mailto:rmc@cbit.ac.in", label: "Email", icon: "✉️" },
];

export default function Footer() {
    return (
        <footer className="relative bg-background pt-24 pb-12 overflow-hidden border-t border-border">
            {/* Massive Watermark */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-[0.03]">
                <motion.span
                    animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-20 -right-20 text-[40rem] font-serif leading-none"
                >
                    ∫
                </motion.span>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Brand Column - Huge */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-4 mb-6 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-teal/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Image
                                    src="/RMC logo-circular.png"
                                    alt="RMC Logo"
                                    width={64}
                                    height={64}
                                    className="relative z-10"
                                />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-2xl tracking-tight">RMC</h3>
                                <p className="text-xs uppercase tracking-widest text-muted">CBIT Hyderabad</p>
                            </div>
                        </Link>
                        <p className="text-muted leading-relaxed font-light mb-8">
                            &quot;The essence of mathematics lies in its freedom.&quot;
                            <br /> <span className="text-sm italic opacity-70">— Georg Cantor</span>
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.href}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-teal hover:border-teal hover:text-white transition-all duration-300"
                                    aria-label={social.label}
                                >
                                    <span className="text-lg">{social.icon}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links - Minimalist */}
                    <div className="lg:pl-8">
                        <h4 className="font-serif font-bold text-lg mb-6">Explore</h4>
                        <ul className="space-y-4">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-muted hover:text-teal transition-colors text-sm uppercase tracking-widest"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-6">Knowledge</h4>
                        <ul className="space-y-4">
                            {resourceLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-muted hover:text-teal transition-colors text-sm uppercase tracking-widest"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Office */}
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-6">Visit Us</h4>
                        <div className="space-y-4 text-sm text-muted font-light">
                            <p>
                                Dept. of Mathematics<br />
                                Chaitanya Bharathi Institute of Technology<br />
                                Gandipet, Hyderabad - 500075
                            </p>
                            <a href="mailto:rmc@cbit.ac.in" className="block hover:text-teal transition-colors">
                                rmc@cbit.ac.in
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <p className="text-xs text-muted font-mono">
                            © {new Date().getFullYear()} RMC CBIT. EST 2018.
                        </p>
                        <Link
                            href="/admin/login"
                            className="text-xs text-muted/50 hover:text-teal transition-colors font-mono flex items-center gap-1"
                        >
                            <span>🔐</span> Admin Portal
                        </Link>
                        <Link
                            href="/coordinator/login"
                            className="text-xs text-muted/50 hover:text-orange transition-colors font-mono flex items-center gap-1"
                        >
                            <span>🎫</span> Coordinator
                        </Link>
                    </div>
                    <p className="text-xs text-muted font-mono flex items-center gap-2">
                        Designed with <span className="text-coral">♥</span> & <span className="text-teal">Infinite</span> Passion
                    </p>
                </div>
            </div>
        </footer>
    );
}
