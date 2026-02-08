"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const containerVars = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08, // Reduced from 0.1 for faster reveal
        },
    },
};

const letterVars = {
    hidden: {
        opacity: 0,
        y: 100,
        filter: "blur(10px)",
        scale: 0.8
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        scale: 1,
        transition: {
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1], // Custom cubic-bezier (replaces spring physics)
        }
    },
};

const staticLetterStyle = {
    opacity: 1,
    filter: "blur(0px)",
    transform: "none"
};

export default function MathTitle({ text = "Ramanujan", className = "" }) {
    const letters = text.split("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className={cn("relative flex flex-col items-center justify-center", className)}>
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-teal/20 blur-[100px] opacity-20 pointer-events-none rounded-full" suppressHydrationWarning />

            <motion.h1
                variants={containerVars}
                initial={false}
                animate={isMounted ? "visible" : false}
                className="relative z-10 flex items-center justify-center py-1 md:py-4"
            >
                {letters.map((char, index) => {
                    const charContent = char === " " ? "\u00A0" : char;
                    const commonClass = "inline-block font-[family-name:var(--font-montserrat)] font-black text-slate-100 cursor-pointer select-none relative pb-1 drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] uppercase tracking-[-0.03em]";

                    // Always use motion.span to prevent hydration mismatch
                    // Animation is disabled until mounted
                    return (
                        <motion.span
                            key={index}
                            variants={letterVars}
                            initial={false}
                            style={staticLetterStyle}
                            whileHover={{
                                y: -10,
                                color: "#2DD4BF",
                                textShadow: "0 0 30px rgba(45,212,191,0.5)",
                                transition: { duration: 0.2 }
                            }}
                            className={commonClass}
                        >
                            {charContent}
                        </motion.span>
                    );
                })}

                {/* Decorative Mathematical Superscript - Static for Hydration stability */}
                <span
                    className="absolute -right-8 top-4 text-2xl text-teal/80 font-serif italic font-[family-name:var(--font-cormorant)]"
                >
                    ∞
                </span>
            </motion.h1>

            {/* Cinematic Underline - Static for LCP stability */}
            <div
                className="h-[1px] bg-gradient-to-r from-transparent via-teal/50 to-transparent mt-1 md:mt-2 w-[100px] opacity-100"
            />
        </div>
    );
}
