"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function EventsHero() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const columns = Math.floor(width / 20);
        const drops = [];
        const chars = "AXIOM_Σ_∫_π_Ω_∆_∇_∞_0_1";

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * height; // Start at random heights
        }

        function draw() {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "#0f0"; // Green text
            ctx.font = "15px monospace";

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];

                // Varied colors for "Matrix" feel but with our Teal branding
                const isTeal = Math.random() > 0.9;
                ctx.fillStyle = isTeal ? "rgba(45, 212, 191, 0.9)" : "rgba(45, 212, 191, 0.1)";

                ctx.fillText(text, i * 20, drops[i] * 20);

                if (drops[i] * 20 > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                drops[i]++;
            }
        }

        const interval = setInterval(draw, 33);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", handleResize);
        }
    }, []);

    return (
        <div className="relative h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-black">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-0 opacity-30"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/50 to-black z-10" />

            <div className="relative z-20 text-center px-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <h1 className="text-6xl md:text-9xl font-[family-name:var(--font-cinzel)] font-bold text-white tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                        EVENTS
                    </h1>
                </motion.div>
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-teal/70 font-mono uppercase tracking-[0.3em] text-sm md:text-lg"
                >
                    EXPLORE THE SPECTRUM OF MATHEMATICS
                </motion.p>
            </div>
        </div>
    );
}
