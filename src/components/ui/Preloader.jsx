"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";

export default function Preloader() {
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState(0);

    useEffect(() => {
        // Check local storage for timestamp
        const lastShown = typeof window !== 'undefined' ? localStorage.getItem("rmc-legacy-preloader-timestamp") : null;
        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();

        const timeSince = lastShown ? now - (parseInt(lastShown) || 0) : Infinity;

        // Show if:
        // 1. Never shown (!lastShown)
        // 2. Expired (> ONE_HOUR)
        // 3. Just started (< 2000ms) - Fix for React Strict Mode
        const shouldShow = !lastShown || timeSince > ONE_HOUR || timeSince < 2000;

        if (!shouldShow) {
            const timer = setTimeout(() => setIsLoading(false), 0);
            return () => clearTimeout(timer);
        }

        // Set timestamp immediately
        localStorage.setItem("rmc-legacy-preloader-timestamp", now.toString());

        // Prevent scrolling during loading
        document.body.style.overflow = "hidden";

        // Cinematic Counter Animation - Optimized for Speed (0.8s instead of 2.0s)
        const controls = animate(2018, 2026, {
            duration: 0.8,
            ease: [0.76, 0, 0.24, 1],
            onUpdate: (value) => setCount(Math.floor(value)),
            onComplete: () => {
                setTimeout(() => {
                    setIsLoading(false);
                    document.body.style.overflow = "";
                }, 50); // Faster transition to content
            }
        });

        return () => {
            controls.stop();
            document.body.style.overflow = "";
        };
    }, []);

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    key="preloader"
                    initial={{ y: 0 }}
                    exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black text-white px-4 md:px-0"
                >
                    {/* Background Noise/Texture - Removed for now */}
                    <div className="absolute inset-0 bg-white/5 opacity-[0.05] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        {/* The Counter */}
                        <div className="flex items-baseline font-serif font-bold tracking-tighter">
                            <div className="flex items-center overflow-hidden h-[1.1em] text-6xl md:text-8xl">
                                <motion.span
                                    initial={{ y: "100%" }}
                                    animate={{ y: "0%" }}
                                    transition={{ duration: 0.8, ease: "circOut" }}
                                >
                                    {count}
                                </motion.span>
                            </div>
                        </div>

                        {/* Loading Text */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-4 font-mono text-sm uppercase tracking-[0.4em] text-teal/90 drop-shadow-[0_0_10px_rgba(58,188,179,0.5)]"
                        >
                            Loading Legacy...
                        </motion.p>
                    </div>

                    {/* Bottom Corner Tag Removed */}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
