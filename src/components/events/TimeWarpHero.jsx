"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

class Particle {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth - canvasWidth / 2;
        this.y = Math.random() * canvasHeight - canvasHeight / 2;
        this.z = Math.random() * 2000;
        this.color = ["#3ABCB3", "#D4AF37", "#FFFFFF"][Math.floor(Math.random() * 3)];
    }

    update(canvasWidth, canvasHeight) {
        this.z -= 10; // Speed
        if (this.z <= 0) {
            this.z = 2000;
            this.x = Math.random() * canvasWidth - canvasWidth / 2;
            this.y = Math.random() * canvasHeight - canvasHeight / 2;
        }
    }

    draw(ctx, canvasWidth, canvasHeight) {
        let x = (this.x / this.z) * 1000 + canvasWidth / 2;
        let y = (this.y / this.z) * 1000 + canvasHeight / 2;
        let radius = (1000 / this.z) * 1.5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = (2000 - this.z) / 2000;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export default function TimeWarpHero() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationFrameId;
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight * 0.6; // 60vh
        };

        const init = () => {
            // Create fewer particles for cleaner look
            for (let i = 0; i < 400; i++) {
                particles.push(new Particle(canvas.width, canvas.height));
            }
        };

        const animate = () => {
            ctx.fillStyle = "#020617"; // Void Black
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                p.update(canvas.width, canvas.height);
                p.draw(ctx, canvas.width, canvas.height);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        resize();
        init();
        animate();
        window.addEventListener("resize", resize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <section className="relative h-[60vh] overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />

            <div className="relative z-20 text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <h1 className="font-serif italic font-black text-6xl md:text-8xl text-white mb-2 mix-blend-overlay">Timeline</h1>
                    <p className="font-mono text-teal text-sm md:text-base uppercase tracking-[0.5em]">The Chronology of Logic</p>
                </motion.div>
            </div>
        </section>
    );
}
