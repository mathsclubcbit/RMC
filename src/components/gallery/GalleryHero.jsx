"use client";

import { motion, useScroll, useTransform, useSpring, useMotionTemplate } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function GalleryHero({ title, subtitle }) {
    const containerRef = useRef(null);
    const boundsRef = useRef(null);
    const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

    // Smooth mouse movement for parallax
    const smoothMouse = {
        x: useSpring(0.5, { stiffness: 50, damping: 20 }),
        y: useSpring(0.5, { stiffness: 50, damping: 20 })
    };

    const handleMouseMove = (e) => {
        const { clientX, clientY, currentTarget } = e;
        if (!boundsRef.current) return;
        const { width, height } = boundsRef.current;
        const x = clientX / width;
        const y = clientY / height;
        smoothMouse.x.set(x);
        smoothMouse.y.set(y);
        setMouse({ x, y });
    };

    const handleMouseEnter = ({ currentTarget }) => {
        boundsRef.current = currentTarget.getBoundingClientRect();
    };

    const handleMouseLeave = () => {
        boundsRef.current = null;
    };

    // Parallax transforms based on smooth mouse
    const lensMoveX = useTransform(smoothMouse.x, [0, 1], [-20, 20]);
    const lensMoveY = useTransform(smoothMouse.y, [0, 1], [-20, 20]);

    const glareRotateX = useTransform(smoothMouse.y, [0, 1], [10, -10]);
    const glareRotateY = useTransform(smoothMouse.x, [0, 1], [-10, 10]);

    return (
        <div
            ref={containerRef}
            className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-[#020617] perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(to_bottom,white,transparent)]" />

            {/* Lens Assembly */}
            <motion.div
                className="absolute z-0 w-[140vw] h-[140vw] max-w-[800px] max-h-[800px] md:w-[800px] md:h-[800px] flex items-center justify-center opacity-60 md:opacity-70 pointer-events-none"
                style={{ x: lensMoveX, y: lensMoveY }}
            >
                {/* 1. Outer Ring - Chassis with Markings */}
                <div className="absolute inset-0 rounded-full border border-white/5 bg-gradient-to-br from-white/5 to-transparent blur-[1px]">
                    {/* Tech Markings Ring */}
                    <div className="absolute inset-2 rounded-full border border-white/5 border-dashed opacity-30 animate-[spin_120s_linear_infinite]" />
                </div>

                {/* 2. Middle Ring - Focusing Element & Scale */}
                <motion.div
                    className="absolute w-[85%] h-[85%] rounded-full border border-teal/10 shadow-[0_0_50px_rgba(45,212,191,0.05)]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                >
                    {/* Text Ring */}
                    <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                        <path id="textCurve" d="M 10,50 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="none" />
                        <text className="text-[2px] font-mono fill-white/20 tracking-[1px] uppercase">
                            <textPath href="#textCurve" startOffset="0%">
                                RMC OPTICS • 50mm 1:1.2 • ASPHERICAL • INFINITY FOCUS • RMC OPTICS • 50mm 1:1.2 • ASPHERICAL • INFINITY FOCUS •
                            </textPath>
                        </text>
                    </svg>
                    <div className="absolute top-0 left-1/2 w-1 h-1 bg-teal/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
                </motion.div>

                {/* 3. Aperture Diagram Lines */}
                <svg className="absolute w-[70%] h-[70%] text-white/5 animate-[spin_120s_linear_infinite_reverse]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    {[...Array(6)].map((_, i) => (
                        <line
                            key={i}
                            x1="50" y1="50"
                            x2={(50 + 48 * Math.cos(i * 60 * Math.PI / 180)).toFixed(2)}
                            y2={(50 + 48 * Math.sin(i * 60 * Math.PI / 180)).toFixed(2)}
                            stroke="currentColor" strokeWidth="0.5"
                        />
                    ))}
                </svg>

                {/* 4. The Glass Lens (3D Tilt Effect) */}
                <motion.div
                    className="absolute w-[50%] h-[50%] rounded-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden"
                    style={{
                        rotateX: glareRotateX,
                        rotateY: glareRotateY,
                        transformStyle: "preserve-3d"
                    }}
                >
                    {/* Inner Reflection (opposes movement) - Multi-coat Purple/Teal */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-tr from-teal/20 via-purple-500/10 to-indigo-500/20 opacity-60 mix-blend-overlay"
                        style={{
                            x: useTransform(smoothMouse.x, [0, 1], [40, -40]),
                            y: useTransform(smoothMouse.y, [0, 1], [40, -40])
                        }}
                    />

                    {/* Sensor Grid Texture */}
                    <div className="absolute inset-[30%] opacity-20 bg-[url('/grid.svg')] bg-[size:10px_10px] rounded-full mix-blend-color-dodge" />

                    {/* Central Aperture Hole */}
                    <div className="w-1/3 h-1/3 bg-[#020617] rounded-full shadow-[inset_0_0_30px_rgba(0,0,0,1)] border border-white/5 flex items-center justify-center relative z-20 overflow-hidden">
                        {/* Shutter Blades Hint */}
                        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.05)_60deg,transparent_60deg)] animate-[spin_10s_linear_infinite]" />
                        <div className="w-2 h-2 rounded-full bg-teal animate-pulse shadow-[0_0_15px_rgba(45,212,191,1)] relative z-30" />
                    </div>
                </motion.div>

                {/* 5. Lens Flare / Glare Elements */}
                <motion.div
                    className="absolute w-[110%] h-[110%] rounded-full bg-gradient-to-tr from-transparent via-transparent to-white/10 blur-3xl pointer-events-none mix-blend-overlay"
                    style={{
                        x: useTransform(smoothMouse.x, [0, 1], [60, -60]),
                        y: useTransform(smoothMouse.y, [0, 1], [60, -60])
                    }}
                />
            </motion.div>

            {/* Content Layer (Foreground) */}
            <div className="relative z-10 container mx-auto px-4 text-center pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 mb-6 border border-white/10 px-4 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                        <span className="font-mono text-[10px] text-white/50 tracking-widest uppercase">VISUAL ARCHIVE</span>
                    </div>

                    <h1 className="font-[family-name:var(--font-montserrat)] font-black text-5xl md:text-7xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50 uppercase tracking-tight leading-tight mb-6 drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                        {title}
                    </h1>

                    <p className="font-sans text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed tracking-wide font-light mix-blend-plus-lighter">
                        {subtitle}
                    </p>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 flex flex-col items-center gap-2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
                <span className="text-[10px] font-mono tracking-widest uppercase">Scroll</span>
                <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
            </motion.div>
        </div>
    );
}
