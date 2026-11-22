"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

export default function MathLoading({ message = "Processing Infinity" }) {
    const [symbolIndex, setSymbolIndex] = useState(0);

    // Array of mathematical symbols carefully selected for cinematic look
    const symbols = useMemo(() => [
        { char: "∑", top: "20%", left: "15%", delay: 0 },
        { char: "π", top: "70%", right: "20%", delay: 0.2 },
        { char: "∫", top: "40%", left: "80%", delay: 0.4 },
        { char: "∞", top: "85%", left: "40%", delay: 0.6 },
        { char: "ζ", top: "15%", right: "30%", delay: 0.8 },
        { char: "φ", top: "50%", left: "10%", delay: 1.0 }
    ], []);

    const centerSymbols = ["∀", "∃", "∇", "∂", "∫", "∩", "∪", "⊕"];

    useEffect(() => {
        const interval = setInterval(() => {
            setSymbolIndex((prev) => (prev + 1) % centerSymbols.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [centerSymbols.length]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
            className="fixed inset-0 z-[999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Background Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.05)_0%,transparent_70%)] pointer-events-none" />

            {/* Floating Symbols Background */}
            <div className="absolute inset-0 pointer-events-none">
                {symbols.map((s, idx) => (
                    <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                        animate={{
                            opacity: [0, 0.4, 0],
                            scale: [0.8, 1, 0.8],
                            filter: "blur(4px)",
                            y: [0, -20, 0]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: s.delay,
                            ease: "easeInOut"
                        }}
                        className="absolute text-5xl font-serif text-teal/20"
                        style={{ top: s.top, left: s.left, right: s.right }}
                    >
                        {s.char}
                    </motion.span>
                ))}
            </div>

            {/* Central Geometric Animation */}
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Outer Rotating Wireframe (Hexagon-ish) */}
                <motion.svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-teal/40"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                >
                    <path
                        d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        strokeLinecap="round"
                    />
                    <path
                        d="M50 5 L50 95 M10 25 L90 25 M10 75 L90 75"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.2"
                        strokeDasharray="2 4"
                    />
                </motion.svg>

                {/* Inner Pulsing Core */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-16 h-16 rounded-full bg-teal/10 border border-teal/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={symbolIndex}
                                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 1.5, rotate: 20 }}
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="font-serif text-2xl text-teal font-bold"
                            >
                                {centerSymbols[symbolIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Rotating Orbiting Particles */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal shadow-[0_0_10px_#2dd4bf]" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal shadow-[0_0_10px_#2dd4bf]" />
                </motion.div>
            </div>

            {/* Loading Text */}
            <div className="mt-12 text-center space-y-2 relative">
                <motion.h3
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-white font-serif italic text-lg tracking-widest uppercase opacity-80"
                >
                    {message}
                </motion.h3>
                <div className="flex items-center justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-1 h-1 bg-teal rounded-full"
                        />
                    ))}
                </div>
            </div>

            {/* Decoding/Scrolling Identities (Very Faint) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
                <style>{`
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        animation: marquee 30s linear infinite;
                    }
                `}</style>
                <div className="flex flex-col gap-4 font-mono text-[10px] whitespace-nowrap animate-marquee">
                    <p>e^(iπ) + 1 = 0 • ∇ × E = -∂B/∂t • ∫ e^(-x^2) dx = √π • iℏ∂/∂t Ψ = ĤΨ e^(iπ) + 1 = 0 • ∇ × E = -∂B/∂t • ∫ e^(-x^2) dx = √π • iℏ∂/∂t Ψ = ĤΨ</p>
                    <p>ζ(s) = ∑ n^(-s) • Φ = (1+√5)/2 • P(A|B) = [P(B|A)P(A)]/P(B) ζ(s) = ∑ n^(-s) • Φ = (1+√5)/2 • P(A|B) = [P(B|A)P(A)]/P(B)</p>
                </div>
            </div>

            {/* Noise Overlay */}
            <div className="absolute inset-0 bg-white/5 opacity-[0.03] pointer-events-none mix-blend-overlay" />
        </motion.div>
    );
}
