"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CinematicIntro({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);
    const [step, setStep] = useState(1);

    useEffect(() => {
        const sequences = [
            // Step 1 is initial state, so we wait for step 2
            { time: 2000, action: () => setStep(2) }, // Show "RMC"
            { time: 3500, action: () => setStep(3) }, // Fade out
            {
                time: 4200, action: () => {
                    onComplete && onComplete();
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
