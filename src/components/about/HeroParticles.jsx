"use client";

import { useRef, useEffect } from "react";

class Particle {
    constructor(width, height, particleLife) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.velocityX = (Math.random() - 0.5) * 1.5;
        this.velocityY = (Math.random() - 0.5) * 1.5;
        this.life = Math.random() * particleLife;
    }

    position(width, height) {
        if ((this.x + this.velocityX > width && this.velocityX > 0) || (this.x + this.velocityX < 0 && this.velocityX < 0)) {
            this.velocityX *= -1;
        }
        if ((this.y + this.velocityY > height && this.velocityY > 0) || (this.y + this.velocityY < 0 && this.velocityY < 0)) {
            this.velocityY *= -1;
        }
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    reDraw(ctx, particleRadius, particleColor) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, particleRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = particleColor;
        ctx.fill();
    }
}

export default function HeroParticles() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const particles = [];
        const properties = {
            bgColor: 'rgba(0, 0, 0, 0)',
            particleColor: 'rgba(45, 212, 191, 0.5)',
            particleRadius: 3,
            particleCount: 80,
            lineLength: 150,
            particleLife: 6,
        };

        function reDrawBackground() {
            ctx.fillStyle = properties.bgColor;
            ctx.fillRect(0, 0, width, height);
        }

        function drawLines() {
            let x1, y1, x2, y2, length, opacity;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    x1 = particles[i].x;
                    y1 = particles[i].y;
                    x2 = particles[j].x;
                    y2 = particles[j].y;
                    length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

                    if (length < properties.lineLength) {
                        opacity = 1 - length / properties.lineLength;
                        ctx.lineWidth = 0.5;
                        ctx.strokeStyle = `rgba(45, 212, 191, ${opacity})`;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
            }
        }

        function reDrawParticles() {
            for (let i = 0; i < particles.length; i++) {
                particles[i].position(width, height);
                particles[i].reDraw(ctx, properties.particleRadius, properties.particleColor);
            }
        }

        let animationFrameId;
        function loop() {
            reDrawBackground();
            reDrawParticles();
            drawLines();
            animationFrameId = requestAnimationFrame(loop);
        }

        function init() {
            for (let i = 0; i < properties.particleCount; i++) {
                particles.push(new Particle(width, height, properties.particleLife));
            }
            loop();
        }

        init();

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 opacity-30"
            style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        />
    );
}
