"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MathTitle({ text = "Ramanujan", className = "" }) {
    const letters = text.split("");

    const containerVars = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
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
                type: "spring",
                damping: 12,
                stiffness: 100
            }
        },
    };

    return (
        <div className={cn("relative flex flex-col items-center justify-center", className)}>
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-teal/20 blur-[100px] opacity-20 pointer-events-none rounded-full" />

            <motion.h1
                variants={containerVars}
                initial="hidden"
                animate="visible"
                className="relative z-10 flex items-center justify-center py-4"
            >
                {letters.map((char, index) => (
                    <motion.span
                        key={index}
                        variants={letterVars}
                        whileHover={{
                            y: -10,
                            color: "#2DD4BF", // Teal-400
                            textShadow: "0 0 30px rgba(45,212,191,0.5)",
                            transition: { duration: 0.2 }
                        }}
                        className="inline-block font-serif font-bold text-slate-100 cursor-pointer select-none relative pb-1 drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                        style={{
                            fontFamily: "var(--font-cormorant)",
                            letterSpacing: "-0.02em"
                        }}
                    >
                        {char === " " ? "\u00A0" : char}

                        {/* Subtle Reflection/Glass Effect per letter */}
                        {char !== " " && (
                            <span className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent mix-blend-overlay opacity-0 hover:opacity-100 transition-opacity duration-300" />
                        )}
                    </motion.span>
                ))}

                {/* Decorative Mathematical Superscript */}
                <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className="absolute -right-8 top-4 text-2xl text-teal/80 font-serif italic"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                    ∞
                </motion.span>
            </motion.h1>

            {/* Cinematic Underline */}
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100px", opacity: 1 }}
                transition={{ delay: 1, duration: 1, ease: "easeOut" }}
                className="h-[1px] bg-gradient-to-r from-transparent via-teal/50 to-transparent mt-2"
            />
        </div>
    );
}
