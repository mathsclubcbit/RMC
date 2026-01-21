"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";

export const BentoGrid = ({ className, children }) => {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}) => {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;

        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <Tilt
            tiltMaxAngleX={2}
            tiltMaxAngleY={2}
            perspective={1000}
            scale={1.005}
            transitionSpeed={1500}
            gyroscope={false}
            className={cn(
                "row-span-1 rounded-3xl group/bento transition duration-200 shadow-none bg-transparent border-transparent justify-between flex flex-col space-y-4",
                className
            )}
            style={{ transformStyle: "preserve-3d" }}
        >
            <div
                ref={divRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative h-full w-full rounded-3xl transition duration-500 shadow-xl border border-white/[0.08] justify-between flex flex-col space-y-4 overflow-hidden group-hover:border-teal/30"
                style={{
                    transformStyle: "preserve-3d",
                    transform: "translateZ(0)",
                    background: "rgba(2, 6, 23, 0.6)", // Ultra-dark frosted
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)"
                }}
            >
                {/* 1. Noise Texture Overlay */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay z-0" />

                {/* 2. Spotlight gradient following mouse */}
                <motion.div
                    className="pointer-events-none absolute -inset-px transition duration-300 z-10 opacity-0 group-hover:opacity-100"
                    style={{
                        background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(58, 188, 179, 0.08), transparent 40%)`,
                    }}
                />

                {/* 3. Geometric Pattern Reveal on Hover */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none z-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233ABCB3' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />

                {/* 4. Content */}
                <div className="relative z-20" style={{ transformStyle: "preserve-3d" }}>
                    {header}
                </div>

                <div className="relative z-20 px-6 pb-6 group-hover/bento:translate-x-2 transition duration-300">
                    <div className="mb-2 w-fit p-2 rounded-lg bg-white/5 border border-white/5 group-hover:text-teal group-hover:border-teal/20 transition-colors">
                        {icon || <div className="w-4 h-4 rounded-full bg-teal/20" />}
                    </div>

                    <div className="font-serif font-bold text-xl text-white mb-2 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-teal transition-all">
                        {title}
                    </div>
                    <div className="font-sans font-normal text-sm text-muted-foreground leading-relaxed max-w-sm">
                        {description}
                    </div>
                </div>
            </div>
        </Tilt>
    );
};
