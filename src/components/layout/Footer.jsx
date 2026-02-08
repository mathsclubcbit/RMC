"use client"; // Fixed hydration mismatch

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram, Linkedin } from "lucide-react";
import NewsletterSignup from "../newsletter/NewsletterSignup";

const quickLinks = [
    { href: "/about", label: "About Us" },
    { href: "/events", label: "Events" },
    { href: "/team", label: "Our Team" },
    { href: "/gallery", label: "Gallery" },
];



const socialLinks = [
    { href: "https://www.instagram.com/rmc.cbit", label: "Instagram", Icon: Instagram },
    { href: "https://www.linkedin.com/company/ramanujan-maths-club/", label: "LinkedIn", Icon: Linkedin },
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
                {/* Newsletter Section */}
                <div className="mb-20">
                    <NewsletterSignup />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-20">
                    {/* Brand Column - Huge */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-4 mb-6 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-teal/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Image
                                    src="/full logo.png"
                                    alt="RMC Logo"
                                    width={64}
                                    height={64}
                                    className="relative z-10 rounded-full"
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
                            {socialLinks.map((social) => {
                                const IconComponent = social.Icon;
                                return (
                                    <a
                                        key={social.href}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-teal hover:border-teal hover:text-white transition-all duration-300"
                                        aria-label={social.label}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                    </a>
                                );
                            })}
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


                    {/* Office */}
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-6">Visit Us</h4>
                        <div className="space-y-4 text-sm text-muted font-light">
                            <p>
                                Math Department<br />
                                Chaitanya Bharathi Institute of Technology<br />
                                Gandipet, Hyderabad - 500075
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <p className="text-xs text-muted font-mono">
                            © {new Date().getFullYear()} RMC CBIT. EST 2018.
                        </p>

                    </div>
                    <p className="text-xs text-muted font-mono flex items-center gap-2">
                        Designed with <span className="text-coral">♥</span> & <span className="text-teal">Infinite</span> Passion
                    </p>
                </div>
            </div>
        </footer>
    );
}
