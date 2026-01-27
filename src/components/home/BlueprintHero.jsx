"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BlueprintHero() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            document.documentElement.style.setProperty('--blueprint-mouse-x', `${x}px`);
            document.documentElement.style.setProperty('--blueprint-mouse-y', `${y}px`);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <section className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-[#0a0a0c] text-white selection:bg-teal selection:text-black">
            {/* Background Layer: The Drafting Board */}
            <div
                className="absolute inset-0 z-0 transition-transform duration-1000 cubic-bezier(0.23, 1, 0.32, 1)"
                style={{ transform: `translate(calc(var(--blueprint-mouse-x, 0px) * 0.5), calc(var(--blueprint-mouse-y, 0px) * 0.5))` }}
            >
                {/* Technical Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:200px_200px]" />

                {/* Blueprint Paper Texture (Subtle Noise) */}
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

                {/* Vertical & Horizontal Axis */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5" />
                <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/5" />

                {/* Drafting Elements Layer with Floating Animation */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-20 transition-transform duration-1000 cubic-bezier(0.23, 1, 0.32, 1) animate-subtle-drift"
                    style={{ transform: `translate(calc(var(--blueprint-mouse-x, 0px) * -0.8), calc(var(--blueprint-mouse-y, 0px) * -0.8))` }}
                >
                    {/* Construction Circle 1 (Compass style) */}
                    <circle
                        cx="75%" cy="30%" r="120"
                        fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 4"
                        className="animate-draw-circle"
                    />
                    <line x1="75%" y1="10%" x2="75%" y2="50%" stroke="white" strokeWidth="0.5" className="animate-draw-line" />
                    <circle cx="75%" cy="30%" r="2" fill="teal" className="opacity-40" />

                    {/* Geometric Construct 2 (Triangle/Ruler style) */}
                    <path
                        d="M 15% 70% L 35% 70% L 25% 45% Z"
                        fill="none" stroke="white" strokeWidth="0.5"
                        className="animate-draw-path"
                    />
                    <line x1="15%" y1="70%" x2="15%" y2="75%" stroke="white" strokeWidth="0.5" opacity="0.2" />
                    <line x1="35%" y1="70%" x2="35%" y2="75%" stroke="white" strokeWidth="0.5" opacity="0.2" />

                    {/* Angle Annotation */}
                    <circle cx="25%" cy="70%" r="40" fill="none" stroke="teal" strokeWidth="0.5" strokeDasharray="2 2" />
                    <text x="26%" y="68%" fill="white" className="font-mono text-[8px] opacity-40 italic">θ = 60.00°</text>

                    {/* Infinite Series Fragment (Decorative) */}
                    <text x="80%" y="85%" fill="white" className="font-serif italic text-[10px] opacity-20">
                        ζ(s) = ∑ n⁻ˢ (n=1 to ∞)
                    </text>
                </svg>

                {/* Coordinate Markers (Math Constants) */}
                <div className="absolute top-10 left-10 p-4 border-l border-t border-white/10 font-serif italic text-white/30 text-lg hidden md:block">
                    e<sup className="text-xs">iπ</sup> + 1 = 0
                </div>
                <div className="absolute bottom-24 right-10 p-4 border-r border-b border-white/10 font-serif italic text-white/30 text-lg hidden md:block text-right">
                    φ ≈ 1.61803...
                </div>
            </div>

            {/* Bottom Blend Layer (Mask for seamless section transition) */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020617] to-transparent z-10 pointer-events-none" />

            {/* Content Layer: The Editorial Layout */}
            <div
                className="relative z-20 w-full max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center transition-transform duration-500 cubic-bezier(0.23, 1, 0.32, 1)"
                style={{ transform: `translate(calc(var(--blueprint-mouse-x, 0px) * 0.15), calc(var(--blueprint-mouse-y, 0px) * 0.15))` }}
            >

                {/* Left Side: Math Notation (Gaussian Integral) */}
                <div className={`md:col-span-1 border-l border-white/10 h-40 hidden lg:flex items-center justify-center -rotate-90 transition-all duration-1000 delay-500 ease-out ${isVisible ? 'opacity-20 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                    <span className="font-serif italic text-sm text-white/40 whitespace-nowrap tracking-widest">
                        ∫<sub className="-bottom-1">-∞</sub><sup className="-top-1">∞</sup> e<sup className="-top-1">-x²</sup> dx = √π
                    </span>
                </div>

                {/* Main Heading Section */}
                <div className="md:col-span-10 text-center md:text-left space-y-10">
                    <header className="space-y-4">
                        <div className={`transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            {/* Math decorative line instead of text */}
                            <div className="w-16 h-[2px] bg-teal/50 mb-4 md:mx-0 mx-auto" />
                        </div>

                        <h1 className="flex flex-col select-none">
                            <span className={`font-serif italic font-[900] text-6xl md:text-8xl lg:text-[11.5rem] leading-tight tracking-tighter transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 scale-95'}`}>
                                Ramanujan
                            </span>
                            <span className={`font-mono font-medium text-4xl md:text-5xl lg:text-[5rem] leading-none tracking-[0.3em] text-white/90 uppercase transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 scale-95'}`}>
                                Math Club
                            </span>
                        </h1>
                    </header>

                    <div className={`max-w-3xl transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                        <p className="text-lg md:text-2xl text-muted/60 leading-relaxed font-light tracking-wide font-sans border-l-2 border-teal/30 pl-8 py-3 group">
                            Pioneering a legacy where <span className="text-white font-medium italic underline underline-offset-8 decoration-teal/20 group-hover:decoration-teal/60 transition-all duration-500">mathematical theory</span> transitions into
                            <span className="text-white font-black mx-1 tracking-tight group-hover:text-teal transition-colors duration-500">high-fidelity reality</span> at CBIT.
                        </p>
                    </div>

                    {/* CTAs with Advanced Micro-interactions */}
                    <div className={`flex flex-col sm:flex-row items-center gap-10 pt-8 transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) delay-900 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                        <Link href="/events" className="group relative px-14 py-6 bg-teal text-black font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[15px_15px_0_rgba(45,212,191,0.15)] overflow-hidden">
                            <span className="relative z-10">Analyze Events</span>
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                        </Link>
                        <Link href="/about" className="group px-14 py-6 border border-white/10 text-white font-bold uppercase tracking-[0.3em] font-mono text-[10px] hover:bg-white/5 hover:border-white/30 transition-all relative">
                            <span className="relative z-10">Our Methodology</span>
                            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-teal group-hover:w-full transition-all duration-500" />
                        </Link>
                    </div>
                </div>

                {/* Right Side Overlay Detail (Calculus Limit) */}
                <div className={`md:col-span-1 hidden lg:block border-r border-white/10 h-64 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-30 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 rotate-90 flex items-center justify-center">
                        <span className="font-serif italic text-sm text-white/60 whitespace-nowrap tracking-widest">
                            lim<sub className="text-[0.6em] not-italic">x→∞</sub> (1 + 1/x)<sup className="text-xs">x</sup> = e
                        </span>
                    </div>
                </div>
            </div>

            {/* Corner Crosshairs with Pulse */}
            <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none opacity-20">
                <div className="absolute top-6 left-0 w-full h-[1px] bg-white animate-pulse" />
                <div className="absolute top-0 left-6 w-[1px] h-full bg-white animate-pulse" />
            </div>
            <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none opacity-20">
                <div className="absolute bottom-6 right-0 w-full h-[1px] bg-white animate-pulse" />
                <div className="absolute bottom-0 right-6 w-[1px] h-full bg-white animate-pulse" />
            </div>

            <style jsx>{`
                @keyframes draw {
                    from { stroke-dashoffset: 1000; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes subtle-drift {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-10px) scale(1.02); }
                }
                .animate-draw-circle {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    animation: draw 3s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }
                .animate-draw-line {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    animation: draw 2s cubic-bezier(0.23, 1, 0.32, 1) 0.5s forwards;
                }
                .animate-draw-path {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    animation: draw 4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }
                .animate-subtle-drift {
                    animation: subtle-drift 20s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </section>
    );
}

