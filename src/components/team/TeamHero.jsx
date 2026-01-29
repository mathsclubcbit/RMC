"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import MathBackground from "@/components/ui/MathBackground";
import MathTitle from "@/components/ui/MathTitle";

export default function TeamHero() {
    const heroRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    // Spotlight Effect Handler
    const handleMouseMove = (e) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    return (
        <div
            ref={heroRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative min-h-[90vh] w-full overflow-hidden flex flex-col items-center justify-center bg-[#020617] group"
        >
            {/* 1. Canvas Background (Vector Field) */}
            <MathBackground />

            {/* 2. Spotlight Effect (Flashlight) */}
            <div
                className="pointer-events-none absolute -inset-px transition duration-300 z-10"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(45, 212, 191, 0.03), transparent 40%)`,
                }}
            />

            {/* 3. Content Content */}
            <div className="relative z-20 text-center px-4">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="inline-block mb-6"
                >
                    <div className="px-5 py-2 rounded-full border border-teal/20 bg-teal/5 text-teal text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase backdrop-blur-md shadow-[0_0_20px_rgba(45,212,191,0.1)]">
                        RMC • 2025-26
                    </div>
                </motion.div>

                {/* Cinematic Title */}
                <div className="mb-6 scale-90 md:scale-100 transform transition-transform duration-700">
                    <MathTitle text="THE COUNCIL" className="text-6xl md:text-9xl" />
                </div>

                {/* Subtitle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="max-w-2xl mx-auto space-y-6"
                >
                    <p className="text-lg md:text-2xl text-white/40 font-serif italic font-light leading-relaxed tracking-wide">
                        &quot;The guardians of logic, ensuring the <span className="text-teal/60">equation</span> remains balanced.&quot;
                    </p>

                    {/* Decorative Divider */}
                    <div className="flex justify-center items-center gap-4 opacity-30 mt-8">
                        <div className="h-px w-12 bg-teal" />
                        <span className="text-teal font-serif">∞</span>
                        <div className="h-px w-12 bg-teal" />
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{
                    opacity: { delay: 2, duration: 1 },
                    y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute bottom-10 z-30 flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
                <span className="text-[10px] uppercase tracking-[0.2em] text-teal/40 font-mono">Scroll</span>
                <div className="w-px h-12 bg-gradient-to-b from-teal/50 to-transparent" />
            </motion.div>

            {/* Gradient Fade to Content */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none z-20" />
        </div>
    );
}
