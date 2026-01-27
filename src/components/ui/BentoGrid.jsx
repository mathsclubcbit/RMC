"use client";

import { useRef } from "react";
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

    const handleMouseMove = (e) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        divRef.current.style.setProperty("--mouse-x", `${x}px`);
        divRef.current.style.setProperty("--mouse-y", `${y}px`);
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
                className="relative h-full w-full rounded-3xl transition duration-500 shadow-xl border border-white/10 justify-between flex flex-col space-y-4 overflow-hidden group-hover:border-teal/40 bg-black/60 backdrop-blur-xl"
                style={{
                    transformStyle: "preserve-3d",
                    transform: "translateZ(0)",
                }}
            >
                {/* 1. Technical Grid Pattern "Lattice" */}
                <div
                    className="absolute inset-0 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none z-0"
                    style={{
                        backgroundImage: `linear-gradient(to right, #3ABCB3 1px, transparent 1px), linear-gradient(to bottom, #3ABCB3 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* 2. Spotlight gradient following mouse */}
                <div
                    className="pointer-events-none absolute -inset-px transition duration-300 z-10 opacity-0 group-hover:opacity-100"
                    style={{
                        background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(58, 188, 179, 0.06), transparent 40%)`,
                    }}
                />

                {/* 3. Corner Brackets (The Logic Lattice Signature) */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal/20 rounded-tl-xl opacity-50 group-hover:opacity-100 group-hover:border-teal transition-all duration-500 bg-transparent z-20" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal/20 rounded-tr-xl opacity-50 group-hover:opacity-100 group-hover:border-teal transition-all duration-500 bg-transparent z-20" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal/20 rounded-bl-xl opacity-50 group-hover:opacity-100 group-hover:border-teal transition-all duration-500 bg-transparent z-20" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal/20 rounded-br-xl opacity-50 group-hover:opacity-100 group-hover:border-teal transition-all duration-500 bg-transparent z-20" />


                {/* 4. Content */}
                <div className="relative z-20" style={{ transformStyle: "preserve-3d" }}>
                    {header}
                </div>

                <div className="relative z-20 px-6 pb-6 group-hover/bento:translate-x-2 transition duration-300">
                    <div className="mb-2 w-fit p-2 rounded-lg bg-teal/5 border border-teal/10 group-hover:text-teal group-hover:border-teal/30 transition-colors">
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
