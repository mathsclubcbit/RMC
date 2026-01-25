"use client";

import { useEffect, useRef } from "react";

export default function MathBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationFrameId;

        // Symbol Settings
        const symbols = ["∑", "∫", "∂", "∇", "∏", "Ω", "λ", "μ", "π", "θ", "∞", "≈", "≠", "≡", "√"];
        const floatingSymbols = [];

        class FloatingSymbol {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.symbol = symbols[Math.floor(Math.random() * symbols.length)];
                this.velocity = {
                    x: (Math.random() - 0.5) * 1.0, // Faster movement
                    y: (Math.random() - 0.5) * 1.0
                };
                this.opacity = 0;
                this.life = 0;
                this.maxLife = 200 + Math.random() * 300;

                // Responsive Size Logic
                const isMobile = canvas.width < 768;
                if (isMobile) {
                    this.size = 12 + Math.random() * 12; // Mobile: 12px - 24px (Smaller/Refined)
                } else {
                    this.size = 24 + Math.random() * 24; // Desktop: 24px - 48px (Large)
                }
            }

            update() {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.life++;

                // Fade in/out
                if (this.life < 50) {
                    this.opacity = this.life / 50;
                } else if (this.life > this.maxLife - 50) {
                    this.opacity = (this.maxLife - this.life) / 50;
                } else {
                    this.opacity = 0.4;
                }

                if (this.life > this.maxLife) {
                    this.reset();
                }
            }

            draw(ctx) {
                ctx.font = `italic ${this.size}px serif`;
                ctx.font = `italic ${this.size}px sans-serif`;
                ctx.fillStyle = `rgba(45, 212, 191, ${this.opacity})`; // Removed 0.6 multiplier
                ctx.fillText(this.symbol, this.x, this.y);
            }
        }

        // Initialize symbols
        // Responsive Count: Fewer symbols on mobile to reduce clutter
        const isMobileInit = window.innerWidth < 768;
        const maxSymbols = isMobileInit ? 8 : 18;

        for (let i = 0; i < maxSymbols; i++) {
            floatingSymbols.push(new FloatingSymbol());
        }

        // Settings
        const spacing = 40; // Increased spacing for cleaner grid
        const length = 12;  // Vector length
        let time = 0;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        // Animation Loop
        const render = () => {
            time += 0.005;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Vector Field
            ctx.strokeStyle = "rgba(45, 212, 191, 0.05)";
            ctx.lineWidth = 1;

            const cols = Math.floor(canvas.width / spacing);
            const rows = Math.floor(canvas.height / spacing);

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * spacing + spacing / 2;
                    const y = j * spacing + spacing / 2;

                    // Vector Field Function (Simple Perlin-ish Noise approximation)
                    // Angle depends on position and time
                    const angle = Math.cos(x * 0.005 + time) * Math.sin(y * 0.005 + time) * Math.PI * 2;

                    // Draw Vector
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
                    ctx.stroke();

                    // Optional: Dot at origin
                    // ctx.beginPath();
                    // ctx.arc(x, y, 1, 0, Math.PI * 2);
                    // ctx.fill();
                }
            }

            // Draw Floating Symbols
            for (const symbol of floatingSymbols) {
                symbol.update();
                symbol.draw(ctx);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-30 pointer-events-none opacity-20"
        />
    );
}
