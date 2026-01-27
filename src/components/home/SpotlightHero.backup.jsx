"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SpotlightHero() {
    const [activeQuote, setActiveQuote] = useState(0);

    const quotes = [
        { line1: "An equation has no meaning,", line2: "unless it expresses a thought of God." },
        { line1: "Exploring the limits of infinity,", line2: "where logic meets unbound imagination." },
        { line1: "Turning numbers into narratives.", line2: "Mathematics is the poetry of logical ideas." }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveQuote((prev) => (prev + 1) % quotes.length);
        }, 8000); // 8 seconds per quote for slow reading
        return () => clearInterval(interval);
    }, []);
    return (
        <section className="relative w-full h-[100dvh] bg-[#020617] overflow-hidden flex items-center justify-center selection:bg-teal selection:text-black">

            {/* 1. The Secrets (Bottom Layer) - Always rendered, fully visible but hidden by mask */}
            <div className="absolute inset-0 z-0">
                <HiddenMathLayer />
            </div>

            {/* 2. The Darkness (Mask Layer) - Covers the secrets */}
            <SpotlightMask />

            {/* 3. The Content (Top Layer) - Text is always visible */}
            <div className="relative z-20 pointer-events-none flex flex-col items-center justify-center text-center px-4 w-full h-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mb-6 pointer-events-auto"
                >
                    <div className="relative group cursor-default">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal/20 via-orange/20 to-teal/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-md hover:border-white/10 transition-colors">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-lime font-serif italic pr-2 border-r border-white/10 text-sm">
                                Est. 2018
                            </span>
                            <span className="text-white/70 text-[10px] uppercase tracking-[0.2em] font-sans">
                                CBIT
                            </span>
                        </div>
                    </div>
                </motion.div>

                <h1 className="flex flex-col items-center justify-center space-y-2 select-none mb-8">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.2, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="font-serif italic font-black text-6xl md:text-9xl lg:text-[10rem] leading-none tracking-tight text-white mix-blend-exclusion z-10"
                    >
                        Ramanujan
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, letterSpacing: "0em" }}
                        animate={{ opacity: 1, letterSpacing: "0.5em" }}
                        transition={{ delay: 1, duration: 2, ease: "easeOut" }}
                        className="font-sans font-bold text-sm md:text-xl lg:text-2xl text-white/50 uppercase tracking-[0.5em] z-10"
                    >
                        Math Club
                    </motion.span>
                </h1>

                <div className="h-24 mb-10 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={activeQuote}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-md text-white/60 font-light text-sm md:text-base leading-relaxed tracking-wide font-sans mix-blend-difference"
                        >
                            {quotes[activeQuote].line1} <br />
                            <span className="text-teal/80 italic font-serif">{quotes[activeQuote].line2}</span>
                        </motion.p>
                    </AnimatePresence>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2, duration: 0.5 }}
                    className="pointer-events-auto"
                >
                    <Link href="/events" className="group relative inline-flex items-center gap-3 px-8 py-3 bg-white text-black rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-teal">
                        <span className="relative z-10 font-bold uppercase tracking-widest text-xs">Enter the Archive</span>
                        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <div className="w-[1px] h-12 bg-gradient-to-b from-teal to-transparent opacity-50" />
                    <span className="text-[10px] uppercase tracking-widest text-teal/50 animate-pulse">Scroll</span>
                </motion.div>

                {/* Smooth Transition Fade */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none z-20" />
            </div>
        </section>
    );
}

function SpotlightMask() {
    const containerRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            requestAnimationFrame(() => {
                setMousePosition({ x: e.clientX, y: e.clientY });
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-10 transition-opacity duration-500"
            style={{
                // transparent at center (light), black at edges (darkness)
                background: `radial-gradient(circle 350px at ${mousePosition.x}px ${mousePosition.y}px, transparent 10%, rgba(2, 6, 23, 0.98) 100%)`
            }}
        >
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    background: `radial-gradient(circle 355px at ${mousePosition.x}px ${mousePosition.y}px, rgba(58,188,179,0.2) 0%, transparent 20%)`
                }}
            />
        </div>
    );
}

// Complex Hidden Background Layer
function HiddenMathLayer() {
    // RMC Brand Colors
    const colors = ["#3ABCB3", "#AFF44A", "#E36951", "#E8B237"];

    // Curated "Pure Math" Equations with randomized colors
    const equations = useMemo(() => [
        { text: "eⁱπ + 1 = 0", scale: 2.2, x: 50, y: 40, blur: 0, opacity: 1, color: colors[0] }, // Euler (Teal)
        { text: "a² + b² = c²", scale: 1.8, x: 80, y: 30, blur: 0.5, opacity: 0.8, color: colors[1] }, // Pythagorean (Lime)
        { text: "A = πr²", scale: 1.5, x: 90, y: 90, blur: 0, opacity: 0.7, color: colors[2] }, // Area (Coral)
        { text: "sin²θ + cos²θ = 1", scale: 1.4, x: 70, y: 15, blur: 1, opacity: 0.6, color: colors[3] }, // Trig (Orange)
        { text: "x = [-b ± √(b²-4ac)] / 2a", scale: 1.2, x: 15, y: 65, blur: 0.5, opacity: 0.8, color: colors[0] },
        { text: "φ ≈ 1.618", scale: 1.5, x: 70, y: 80, blur: 0, opacity: 0.7, color: colors[1] },
        { text: "∫ₐᵇ f(x) dx = F(b) - F(a)", scale: 1.3, x: 25, y: 25, blur: 0.5, opacity: 0.8, color: colors[2] },
        { text: "lim(x→∞) (1 + 1/x)ˣ = e", scale: 1.3, x: 10, y: 80, blur: 1, opacity: 0.6, color: colors[3] },
        { text: "∑ n = n(n+1)/2", scale: 1.2, x: 85, y: 60, blur: 0.5, opacity: 0.5, color: colors[0] },
        { text: "(x+y)ⁿ = ∑ (n k) xⁿ⁻ᵏ yᵏ", scale: 1.1, x: 30, y: 85, blur: 1, opacity: 0.5, color: colors[1] },
        { text: "f'(x) = lim(h→0) [f(x+h)-f(x)]/h", scale: 1.2, x: 40, y: 10, blur: 0.5, opacity: 0.7, color: colors[2] },
        { text: "V - E + F = 2", scale: 1.4, x: 60, y: 50, blur: 0, opacity: 0.8, color: colors[3] }
    ].map(eq => ({
        ...eq,
        rotation: (Math.random() - 0.5) * 10
    })), []);

    const dustParticles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: Math.random() * 3 + "px",
        height: Math.random() * 3 + "px",
        backgroundColor: colors[i % 4],
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${10 + Math.random() * 20}s`
    })), []);

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden relative bg-black">
            {/* 1. Deep Space Gradient with subtle color bleed */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#020617] to-[#041016]" />

            {/* Subtle Radial Gradients of Brand Colors */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#3ABCB3]/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E36951]/10 blur-[100px] rounded-full" />
            <div className="absolute top-[40%] right-[-10%] w-[30%] h-[30%] bg-[#AFF44A]/5 blur-[80px] rounded-full" />


            {/* 2. Technical Blueprint Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

            {/* 3. Central Sacred Geometry (Rotating Mandala) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <svg className="w-[800px] h-[800px] animate-[spin_120s_linear_infinite]" viewBox="0 0 500 500">
                    <circle cx="250" cy="250" r="100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-teal" />
                    <circle cx="250" cy="250" r="150" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-teal" strokeDasharray="4 4" />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ellipse
                            key={i}
                            cx="250" cy="250" rx="100" ry="240"
                            fill="none" stroke="currentColor" strokeWidth="0.5"
                            className="text-teal/50"
                            transform={`rotate(${i * 60} 250 250)`}
                        />
                    ))}
                </svg>
            </div>

            {/* 4. Curated Equations with Colors */}
            {equations.map((eq, i) => (
                <div
                    key={i}
                    className="absolute font-serif whitespace-nowrap select-none italic"
                    style={{
                        top: `${eq.y}%`,
                        left: `${eq.x}%`,
                        fontSize: `${eq.scale}rem`,
                        filter: `blur(${eq.blur}px)`,
                        opacity: eq.opacity,
                        color: eq.color,
                        transform: `translate(-50%, -50%) rotate(${eq.rotation}deg)`,
                        textShadow: `0 0 15px ${eq.color}40`
                    }}
                >
                    {eq.text}
                </div>
            ))}

            {/* 5. Floating Particles (Multicolor Dust) */}
            {dustParticles.map((particle, i) => (
                <div
                    key={`dust-${i}`}
                    className="absolute rounded-full"
                    style={{
                        top: particle.top,
                        left: particle.left,
                        width: particle.width,
                        height: particle.height,
                        backgroundColor: particle.backgroundColor,
                        filter: "blur(0.5px)",
                        opacity: 0.6,
                        animation: `float ${particle.animationDuration} infinite ease-in-out`,
                        animationDelay: particle.animationDelay
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
            `}</style>
        </div>
    );
}
