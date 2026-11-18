"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CinematicHero() {
    return (
        <section className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-[#020617] text-white selection:bg-teal selection:text-black">

            {/* Canvas Layer */}
            {/* <CanvasBackground /> */}

            {/* Content Layer */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center flex flex-col items-center justify-center h-full">

                {/* Intro Tag */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mb-8"
                >
                    <p className="font-sans text-xs md:text-sm tracking-[0.5em] uppercase text-teal/80">Est. 2018 // CBIT</p>
                </motion.div>

                {/* Main Headline */}
                <h1 className="flex flex-col items-center justify-center space-y-2 select-none">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.9, y: 50, filter: "blur(20px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.2, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="font-serif italic font-black text-6xl md:text-9xl lg:text-[13rem] leading-none tracking-tight text-white mix-blend-overlay opacity-90"
                    >
                        Ramanujan
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, letterSpacing: "0em" }}
                        animate={{ opacity: 1, letterSpacing: "0.5em" }}
                        transition={{ delay: 1, duration: 2, ease: "easeOut" }}
                        className="font-sans font-bold text-sm md:text-xl lg:text-3xl text-gradient uppercase tracking-[0.5em] z-10"
                    >
                        Math Club
                    </motion.span>
                </h1>

                {/* Subtitle / Bio */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="mt-12 max-w-lg text-white/50 font-light text-sm md:text-base leading-relaxed tracking-wide font-sans text-center"
                >
                    Decoding the infinite language of the universe. <br />
                    <span className="text-teal/60 italic font-serif">Where logic harmonizes with beauty.</span>
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="mt-16 flex flex-col sm:flex-row items-center gap-8"
                >
                    <Link href="/events" className="px-10 py-4 bg-white/5 border border-white/10 rounded-full backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                        <span className="font-sans text-xs font-bold uppercase tracking-widest text-white group-hover:text-teal transition-colors">Explore Events</span>
                    </Link>
                </motion.div>

            </div>

            {/* Bottom Fade */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020617] to-transparent z-20 pointer-events-none" />
        </section>
    );
}

// Separated component for performance (Canvas logic)
function CanvasBackground() {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", handleMouseMove);

        // Particle Config
        const symbols = ["π", "e", "Σ", "∫", "∂", "√", "∞", "θ", "λ", "φ", "Δ", "Ω"];
        // Reduced count for mobile optimization
        const particleCount = window.innerWidth < 768 ? 20 : 40;

        const particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 30 + 10,
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            opacity: 0,
            targetOpacity: Math.random() * 0.2 + 0.05,
            baseX: 0, // For restoring after gravity
            baseY: 0
        }));

        const draw = () => {
            // Trail effect (Soft clear)
            ctx.fillStyle = "rgba(2, 6, 23, 0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                // Gravity
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Mouse Interaction Radius
                if (dist < 300) {
                    const force = (300 - dist) / 300;
                    p.x += (dx / dist) * force * 1.5;
                    p.y += (dy / dist) * force * 1.5;
                    ctx.fillStyle = `rgba(58, 188, 179, ${p.opacity + 0.4})`; // Teal glow
                } else {
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`; // White normal
                }

                // Movement
                p.x += p.dx;
                p.y += p.dy;

                // Wrap
                if (p.x < -50) p.x = canvas.width + 50;
                if (p.x > canvas.width + 50) p.x = -50;
                if (p.y < -50) p.y = canvas.height + 50;
                if (p.y > canvas.height + 50) p.y = -50;

                // Render
                ctx.font = `italic ${p.size}px "Playfair Display", serif`;
                ctx.fillText(p.symbol, p.x, p.y);
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-60" />;
}
