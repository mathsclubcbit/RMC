"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Radio, Bell, AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AnnouncementsWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [entranceDelay, setEntranceDelay] = useState(1); // Default short delay

    useEffect(() => {
        setMounted(true);

        // Calculate Delay based on Preloader logic
        const checkPreloader = () => {
            const lastShown = typeof window !== 'undefined' ? localStorage.getItem("rmc-legacy-preloader-timestamp") : null;
            const now = Date.now();
            const timeSince = lastShown ? now - (parseInt(lastShown) || 0) : Infinity;
            const ONE_HOUR = 60 * 60 * 1000;

            // Logic matches Preloader.jsx condition
            // If it ran recently (< 5s), or will run (expired/never shown)
            // We verify if it's "active" for this session
            const isPreloaderActive = !lastShown || timeSince > ONE_HOUR || timeSince < 5000;

            if (isPreloaderActive) {
                // Preloader (3s) + 1s requested delay = 4s total
                // Adding slight buffer for smoothness
                setEntranceDelay(4.2);
            } else {
                setEntranceDelay(1);
            }
        };

        checkPreloader();

        const fetchAnnouncements = async () => {
            try {
                const res = await fetch('/api/announcements');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAnnouncements(data);
                } else {
                    setAnnouncements([]);
                }
            } catch (error) {
                console.error("Failed to load announcements", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="pointer-events-auto mb-4 w-80 md:w-96 bg-[#0a0a0a]/90 backdrop-blur-xl border border-teal/20 rounded-2xl shadow-[0_0_30px_-5px_rgba(45,212,191,0.15)] overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-teal/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-teal animate-pulse" />
                                <span className="font-[family-name:var(--font-cinzel)] text-sm font-bold text-white tracking-widest">
                                    Announcements
                                </span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {isLoading ? (
                                <div className="text-center py-6 text-white/30 text-xs font-mono animate-pulse">
                                    [Scanning Frequencies...]
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="text-center py-6 text-white/30 text-xs font-mono">
                                    [No Active Signals]
                                </div>
                            ) : (
                                announcements.map((item) => (
                                    <div key={item.id} className="group p-3 rounded-lg bg-white/5 border border-white/5 hover:border-teal/20 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {item.category === 'Critical' ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <Bell className="w-3 h-3 text-teal" />}
                                                <span className={`text-[10px] font-mono uppercase tracking-wider ${item.category === 'Critical' ? 'text-red-400' : 'text-teal'}`}>
                                                    {item.category}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-white/30 font-mono flex items-center gap-1">
                                                <Calendar className="w-2 h-2" /> {item.date}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-serif font-bold text-white/90 mb-1 leading-tight group-hover:text-teal transition-colors">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs text-white/50 leading-relaxed font-sans">
                                            {item.content}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-white/5 bg-black/40 text-center">
                            <Link href="/announcements" className="text-[10px] font-mono uppercase tracking-widest text-teal/70 hover:text-teal flex items-center justify-center gap-1 w-full transition-colors">
                                View Full History <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cinematic Toggle Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0, y: 20, filter: "blur(10px)" }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    filter: "blur(0px)",
                    boxShadow: ["0 0 0 0 rgba(45,212,191,0)", "0 0 0 10px rgba(45,212,191,0.2)", "0 0 0 0 rgba(45,212,191,0)"]
                }}
                transition={{
                    opacity: { delay: entranceDelay, duration: 0.6 },
                    scale: { delay: entranceDelay, duration: 0.6, type: "spring", stiffness: 200, damping: 15 },
                    y: { delay: entranceDelay, duration: 0.6, type: "spring", stiffness: 200, damping: 15 },
                    filter: { delay: entranceDelay, duration: 0.6 },
                    boxShadow: { delay: entranceDelay + 0.4, duration: 1.5, times: [0, 0.5, 1] }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto p-4 rounded-full shadow-2xl group relative ${isOpen ? 'bg-white text-black rotate-90' : 'bg-teal/10 border border-teal/30 hover:bg-teal hover:border-teal text-teal hover:text-black'}`}
            >
                {/* Ping Effect (Only when idle) */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-teal"></span>
                    </span>
                )}

                {isOpen ? <X className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
            </motion.button>

        </div>,
        document.body
    );
}
