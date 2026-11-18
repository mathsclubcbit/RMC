"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-black text-white overflow-hidden relative selection:bg-teal selection:text-black">
            {/* Background Symbols */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                <span className="absolute top-10 left-10 text-9xl font-serif text-teal/20 blur-sm">?</span>
                <span className="absolute bottom-20 right-20 text-[15rem] font-serif text-white/5 rotate-12">404</span>
                <span className="absolute top-1/2 left-1/4 text-6xl font-serif text-teal/10">∅</span>
            </div>

            <div className="z-10 text-center px-4">
                <motion.h1
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-[12rem] md:text-[20rem] font-black font-serif leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10"
                >
                    404
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-2xl md:text-4xl font-bold font-sans tracking-widest uppercase mb-4 text-teal">
                        Solution Undefined
                    </h2>
                    <p className="text-muted-foreground font-mono text-sm md:text-base max-w-md mx-auto mb-10">
                        The coordinates you are looking for lie outside the defined domain of this website.
                    </p>

                    <Link
                        href="/"
                        className="group relative inline-flex items-center gap-3 px-8 py-3 bg-white/5 border border-white/10 rounded-full overflow-hidden hover:bg-white/10 transition-all"
                    >
                        <span className="relative z-10 font-mono text-xs font-bold uppercase tracking-widest group-hover:text-teal transition-colors">
                            Return to Origin
                        </span>
                        <div className="absolute inset-0 bg-teal/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
