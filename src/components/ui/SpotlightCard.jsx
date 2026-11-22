"use client";
import { useRef, useState } from "react";

const COLOR_MAP = {
    teal: "rgba(45, 155, 148, 0.15)",
    lime: "rgba(155, 197, 61, 0.15)",
    coral: "rgba(227, 105, 81, 0.15)",
    orange: "rgba(232, 178, 55, 0.15)",
};

export default function SpotlightCard({ children, className = "", color = "teal" }) {
    const divRef = useRef(null);
    const [opacity, setOpacity] = useState(0);
    const boundsRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!boundsRef.current) return;
        const { left, top } = boundsRef.current;
        const x = e.clientX - left;
        const y = e.clientY - top;
        divRef.current.style.setProperty("--mouse-x", `${x}px`);
        divRef.current.style.setProperty("--mouse-y", `${y}px`);
    };

    const handleMouseEnter = () => {
        if (divRef.current) {
            boundsRef.current = divRef.current.getBoundingClientRect();
        }
        setOpacity(1);
    };
    const handleMouseLeave = () => {
        boundsRef.current = null;
        setOpacity(0);
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
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${COLOR_MAP[color]}, transparent 40%)`,
                }}
            />
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
}
