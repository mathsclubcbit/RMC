"use client";

import { useEffect, useRef, useState } from "react";

export default function SpotlightCard({ children, className = "", color = "teal" }) {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;

        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    const colorMap = {
        teal: "rgba(45, 155, 148, 0.15)",
        lime: "rgba(155, 197, 61, 0.15)",
        coral: "rgba(227, 105, 81, 0.15)",
        orange: "rgba(232, 178, 55, 0.15)",
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-2xl ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${colorMap[color]}, transparent 40%)`,
                }}
            />
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
}
