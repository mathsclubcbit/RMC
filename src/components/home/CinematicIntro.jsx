"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CinematicIntro({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);
    const [step, setStep] = useState(1);
    const [mathPositions, setMathPositions] = useState([]);

    useEffect(() => {
        // Handle math positions once on mount to avoid impure renders
        const equations = ["eⁱπ + 1 = 0", "V - E + F = 2", "∇ ⋅ B = 0", "∫ e⁻ˣ² dx = √π", "∑ (1/n²) = π²/6", "f(x) ≈ f(a) + f'(a)(x-a) + ...", "E = mc²", "sin²θ + cos²θ = 1"];
        const positions = equations.map(() => ({
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`
        }));
        Promise.resolve().then(() => setMathPositions(positions));

        // Check local storage for timestamp
        const lastShown = typeof window !== 'undefined' ? localStorage.getItem("rmc-intro-timestamp") : null;
        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();

        // Robust time check
        const timeSince = lastShown ? now - (parseInt(lastShown) || 0) : Infinity;

        // Show if:
        // 1. Never shown (!lastShown)
        // 2. Expired (> ONE_HOUR)
        // 3. Just started (< 2000ms) - Fix for React Strict Mode which runs effect twice
        const shouldShow = !lastShown || timeSince > ONE_HOUR || timeSince < 2000;

        if (!shouldShow) {
            Promise.resolve().then(() => {
                setIsVisible(false);
                if (onComplete) onComplete();
            });
            return;
        }

        // Set timestamp immediately to prevent "refresh loop" exploits
        localStorage.setItem("rmc-intro-timestamp", now.toString());

        const sequences = [
            // Step 1 is initial state, so we wait for step 2
            { time: 500, action: () => setStep(2) }, // Show "RMC" fast
            { time: 2000, action: () => setStep(3) }, // Fade out
            {
                time: 2500, action: () => {
                    if (onComplete) onComplete();
                    setIsVisible(false);
                }
            }, // Finish
        ];

        let timeouts = [];

        sequences.forEach(({ time, action }) => {
            timeouts.push(setTimeout(action, time));
        });

        return () => timeouts.forEach((t) => clearTimeout(t));
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={step === 3 ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
        >
            <div className="relative overflow-hidden w-full h-full flex items-center justify-center">

                {/* Floating Math Equations Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {["eⁱπ + 1 = 0", "V - E + F = 2", "∇ ⋅ B = 0", "∫ e⁻ˣ² dx = √π", "∑ (1/n²) = π²/6", "f(x) ≈ f(a) + f'(a)(x-a) + ...", "E = mc²", "sin²θ + cos²θ = 1"].map((eq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50, filter: "blur(4px)" }}
                            animate={{ opacity: [0, 0.5, 0], y: -80, filter: "blur(0px)" }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                delay: i * 0.4,
                                ease: "easeInOut"
                            }}
                            className="absolute text-teal/40 font-serif italic text-lg md:text-3xl select-none whitespace-nowrap font-bold"
                            style={{
                                left: mathPositions[i]?.left || "50%",
                                top: mathPositions[i]?.top || "50%"
                            }}
                        >
                            {eq}
                        </motion.div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="math"
                            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
                            transition={{ duration: 0.8 }}
                            className="text-white/20 font-serif text-4xl md:text-6xl italic"
                        >
                            Logic is the beginning...
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div
                            key="logo"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <h1 className="text-8xl md:text-9xl font-serif font-bold text-white tracking-tighter">
                                RMC
                            </h1>
                            <div className="h-[1px] w-24 bg-teal/50" />
                            <p className="text-teal font-mono text-xs uppercase tracking-[0.5em]">
                                Est. 2018
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Noise Overlay */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
            </div>
        </motion.div>
    );
}
