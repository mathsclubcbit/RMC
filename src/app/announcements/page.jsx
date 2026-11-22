"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, AlertTriangle, Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import MathBackground from "@/components/ui/MathBackground";

export default function AnnouncementsHistory() {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch('/api/announcements');
                const data = await res.json();
                setAnnouncements(data);
            } catch (error) {
                console.error("Failed to load announcements", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-teal/30 selection:text-teal font-sans overflow-x-hidden relative">
            <MathBackground />

            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft className="w-5 h-5 text-teal transition-transform group-hover:-translate-x-1" />
                        <span className="font-mono text-sm text-teal uppercase tracking-widest">Return to Base</span>
                    </Link>
                    <h1 className="font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-teal/80 to-teal">
                        Transmission Log
                    </h1>
                    <div className="w-24"></div> {/* Spacer for centering */}
                </div>
            </header>

            <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
                <div className="max-w-4xl mx-auto space-y-12">

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-2 border-teal border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-mono text-teal/70 animate-pulse">[DECRYPTING ARCHIVES...]</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-20 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                            <h2 className="font-[family-name:var(--font-cinzel)] text-2xl text-white/50 mb-2">No Signals Detected</h2>
                            <p className="font-mono text-sm text-white/30">The archives are currently empty.</p>
                        </div>
                    ) : (
                        <div className="relative border-l border-white/10 ml-4 md:ml-0 space-y-12 pb-12">
                            {announcements.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="relative pl-8 md:pl-12 group"
                                >
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-[-5px] top-6 w-2.5 h-2.5 rounded-full border-2 ${item.category === 'Critical' ? 'bg-red-500 border-red-900 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-teal border-teal/20 shadow-[0_0_10px_rgba(45,212,191,0.5)]'} transition-all group-hover:scale-125 z-10`}></div>

                                    {/* Card */}
                                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-xl p-6 md:p-8 hover:border-teal/30 transition-all duration-300 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] group-hover:shadow-[0_0_30px_-10px_rgba(45,212,191,0.1)]">

                                        {/* Meta Header */}
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
                                            <div className="flex items-center gap-3">
                                                {item.category === 'Critical' ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono uppercase tracking-wider">
                                                        <AlertTriangle className="w-3 h-3" /> Critical
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-[10px] font-mono uppercase tracking-wider">
                                                        <Bell className="w-3 h-3" /> {item.category}
                                                    </span>
                                                )}
                                                <span className="text-white/30 text-xs font-mono flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" /> {item.date}
                                                </span>
                                            </div>
                                            <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
                                                ID: {item.id.substring(0, 8)}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <h2 className="font-[family-name:var(--font-cinzel)] text-2xl text-white mb-4 group-hover:text-teal transition-colors">
                                            {item.title}
                                        </h2>
                                        <p className="text-white/60 font-sans leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                                            {item.content}
                                        </p>

                                        {/* Footer */}
                                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="font-mono text-xs text-white/30">
                                                Posted by: <span className="text-teal/70">{item.postedBy}</span>
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
