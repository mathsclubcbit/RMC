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
        const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
        const memory = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 4;
        const isLowEnd = cores < 4 || memory < 4;

        // Disable canvas on very low-end devices to save resources
        if (isLowEnd && isMobileInit) {
            console.log('MathBackground: Disabled on low-end mobile device for performance');
            return;
        }

        const maxSymbolsCount = isMobileInit ? 5 : 18;

        for (let i = 0; i < maxSymbolsCount; i++) {
            floatingSymbols.push(new FloatingSymbol(canvas.width, canvas.height));
        }

        // Settings - Increased spacing for better performance
        const spacing = isMobileInit ? 80 : 60;
        const length = 12;
        let time = 0;

        // Track if animation is running
        let isRunning = true;

        // Throttle to 30fps for better performance
        let lastTime = 0;
        const fps = 30;
        const fpsInterval = 1000 / fps;

        // Animation Loop
        const render = (currentTime) => {
            if (!isRunning) return;

            const elapsed = currentTime - lastTime;

            // Throttle rendering to 30fps
            if (elapsed < fpsInterval) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            lastTime = currentTime - (elapsed % fpsInterval);

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

        // Pause animation when tab is hidden to save CPU
        const handleVisibilityChange = () => {
            if (document.hidden) {
                isRunning = false;
                cancelAnimationFrame(animationFrameId);
            } else {
                isRunning = true;
                render();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        render();

        return () => {
            isRunning = false;
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
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
