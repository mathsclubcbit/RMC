"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MathTitle from "@/components/ui/MathTitle";

const quotes = [
    { line1: "An equation has no meaning,", line2: "unless it expresses a thought of God." },
    { line1: "Exploring the limits of infinity,", line2: "where logic meets unbound imagination." },
    { line1: "Turning numbers into narratives.", line2: "Mathematics is the poetry of logical ideas." }
];

export default function SpotlightHero({ startAnimation = true, skipped = false }) {
    const [activeQuote, setActiveQuote] = useState(0);

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
                    initial={skipped ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    animate={skipped || startAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: skipped ? 0 : 1, ease: "easeOut" }}
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
                    <MathTitle
                        text="Ramanujan"
                        className="text-6xl md:text-9xl lg:text-[10rem] leading-none tracking-tight mb-2"
                    />
                    <motion.span
                        initial={{ opacity: 0, letterSpacing: "0em" }}
                        animate={{ opacity: 1, letterSpacing: "0.5em" }}
                        transition={{ delay: skipped ? 0.1 : 1, duration: skipped ? 0.8 : 2, ease: "easeOut" }}
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
                    transition={{ delay: skipped ? 0.3 : 2, duration: 0.5 }}
                    className="pointer-events-auto"
                >
                    <MagneticButton>
                        <Link href="/events" className="group relative inline-flex items-center gap-3 px-8 py-3 bg-white text-black rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-teal">
                            <span className="relative z-10 font-bold uppercase tracking-widest text-xs">Enter the Archive</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </MagneticButton>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: skipped ? 0.5 : 2.5, duration: 1 }}
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
    const [mousePosition, setMousePosition] = useState({ x: null, y: null });

    useEffect(() => {
        const handleMouseMove = (e) => {
            requestAnimationFrame(() => {
                setMousePosition({ x: e.clientX, y: e.clientY });
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const cx = mousePosition.x === null ? "50%" : `${mousePosition.x}px`;
    const cy = mousePosition.y === null ? "50%" : `${mousePosition.y}px`;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-10 transition-opacity duration-500"
            style={{
                // transparent at center (light), black at edges (darkness)
                background: `radial-gradient(circle 350px at ${cx} ${cy}, transparent 10%, rgba(2, 6, 23, 0.98) 100%)`
            }}
        >
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    background: `radial-gradient(circle 355px at ${cx} ${cy}, rgba(58,188,179,0.2) 0%, transparent 20%)`
                }}
            />
        </div>
    );
}

// Starfield & Deep Space Background
function HiddenMathLayer() {
    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden relative bg-black">
            {/* 1. Deep Space Gradient - Pitch Black to Dark Slate */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#01030a] to-[#020617]" />

            {/* 2. Starfield (Static + Twinkle) */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.15] mix-blend-overlay" />

            {/* 3. Subtle Nebula Glows (Reduced Opacity) */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-teal/5 blur-[150px] rounded-full opacity-40 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full opacity-40" />

            {/* 4. Technical Grid (Faint) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />
        </div>
    );
}

// Magnetic Button Component - Optimized to avoid forced reflows
function MagneticButton({ children }) {
    const ref = useRef(null);
    const boundsRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Cache bounds on mouseenter to avoid getBoundingClientRect on every mousemove
    const handleMouseEnter = () => {
        if (ref.current) {
            boundsRef.current = ref.current.getBoundingClientRect();
        }
    };

    const handleMouse = (e) => {
        // Use cached bounds instead of reading layout on every move
        if (!boundsRef.current) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = boundsRef.current;
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
        boundsRef.current = null;
    };

    const { x, y } = position;
    return (
        <motion.div
            ref={ref}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            {children}
        </motion.div>
    );
}

