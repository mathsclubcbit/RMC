"use client";

import { useEffect, useRef } from "react";

const SYMBOLS_POOL = ["∑", "∫", "∂", "∇", "∏", "Ω", "λ", "μ", "π", "θ", "∞", "≈", "≠", "≡", "√"];

class FloatingSymbol {
    constructor(canvasWidth, canvasHeight) {
        this.reset(canvasWidth, canvasHeight);
    }

    reset(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.symbol = SYMBOLS_POOL[Math.floor(Math.random() * SYMBOLS_POOL.length)];
        this.velocity = {
            x: (Math.random() - 0.5) * 1.0,
            y: (Math.random() - 0.5) * 1.0
        };
        this.opacity = 0;
        this.life = 0;
        this.maxLife = 200 + Math.random() * 300;

        // Responsive Size Logic
        const isMobile = canvasWidth < 768;
        if (isMobile) {
            this.size = 12 + Math.random() * 12;
        } else {
            this.size = 24 + Math.random() * 24;
        }
    }

    update(canvasWidth, canvasHeight) {
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
            this.reset(canvasWidth, canvasHeight);
        }
    }

    draw(ctx) {
        ctx.font = `italic ${this.size}px serif`;
        ctx.fillStyle = `rgba(45, 212, 191, ${this.opacity})`;
        ctx.fillText(this.symbol, this.x, this.y);
    }
}

export default function MathBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationFrameId;

        const floatingSymbols = [];

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        // Initialize symbols
        const isMobileInit = canvas.width < 768;
        const maxSymbolsCount = isMobileInit ? 8 : 18;

        for (let i = 0; i < maxSymbolsCount; i++) {
            floatingSymbols.push(new FloatingSymbol(canvas.width, canvas.height));
        }

        // Settings
        const spacing = 40;
        const length = 12;
        let time = 0;

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
                    const angle = Math.cos(x * 0.005 + time) * Math.sin(y * 0.005 + time) * Math.PI * 2;

                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
                    ctx.stroke();
                }
            }

            // Draw Floating Symbols
            for (const symbol of floatingSymbols) {
                symbol.update(canvas.width, canvas.height);
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
