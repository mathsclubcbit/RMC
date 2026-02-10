"use client";
// Force recompile to clear hydration cache


import { motion } from "framer-motion";
import MathTitle from "@/components/ui/MathTitle";
import { useState, useEffect } from "react";

export default function HeroOverlay() {
    return (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center -translate-y-8 md:translate-y-0">
            <div className="max-w-4xl px-6 text-center">

                {/* Header Tag - Visible by default for LCP */}
                <motion.div
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="mb-1 md:mb-10"
                >
                    <div className="inline-flex items-center gap-3 px-3 py-1 md:px-5 md:py-2 rounded-full border border-teal/20 bg-teal/5 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(45,212,191,0.2)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                        <span className="font-[family-name:var(--font-cinzel)] text-teal/90 text-[10px] md:text-xs tracking-[0.2em] font-bold">
                            EST. MMXVIII
                        </span>
                    </div>
                </motion.div>

                {/* Main Title - Serif & Huge (Using MathTitle component for consistency) */}
                <div className="mb-0 md:mb-6 scale-90 md:scale-100 origin-center pointer-events-auto">
                    <MathTitle text="RAMANUJAN" className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tight" />
                </div>

                <motion.div
                    initial={false}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                >
                    <span className="block mt-0 md:mt-4 font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl lg:text-5xl italic text-teal font-light tracking-wide normal-case drop-shadow-none">Maths Club</span>
                </motion.div>

                {/* Subtitle - Definition Style */}
                <motion.div
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="font-serif text-xl md:text-2xl text-white/60 leading-relaxed italic max-w-2xl mx-auto"
                >
                    Journey to Infinity
                </motion.div>
            </div>

            {/* Gradient Vignette for Text Readability - Reduced opacity and blend mode to reveal background */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/10 to-black/60 pointer-events-none z-0" />

            {/* Scroll Indicator - Final Adjusted Position */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{
                    opacity: { delay: 1, duration: 1 },
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute bottom-32 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none"
            >
                <span className="text-[10px] md:text-xs font-[family-name:var(--font-cinzel)] text-teal/80 tracking-[0.3em] uppercase font-bold">Scroll Down ▾</span>
                <div className="w-[1px] h-10 bg-gradient-to-b from-transparent via-teal/50 to-transparent" />
                <div className="w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_15px_rgba(45,212,191,0.8)]" />
            </motion.div>
        </div>
    );
}
