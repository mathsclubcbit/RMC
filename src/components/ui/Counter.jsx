"use client";

import { useEffect, useState, useRef } from "react";

export default function Counter({ end, duration = 2000, label, icon, color = "teal", suffix = "+", className = "" }) {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let startTime;
        const startValue = 0;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(startValue + (end - startValue) * easeOut));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isVisible, end, duration]);

    const colorClasses = {
        teal: "text-teal",
        lime: "text-lime",
        coral: "text-coral",
        orange: "text-orange",
        white: "text-white"
    };

    // If label/icon are provided, render Card mode. Else render Simple mode (just the number).
    if (label || icon) {
        return (
            <div
                ref={ref}
                className={`text-center ${isVisible ? "opacity-100 transform translate-y-0" : "opacity-0 translate-y-4"} transition-all duration-700 ${className}`}
            >
                {icon && <div className={`text-4xl mb-2 ${colorClasses[color]}`}>{icon}</div>}
                <div className={`text-4xl md:text-5xl font-bold ${colorClasses[color]} font-serif`}>
                    {count}{suffix}
                </div>
                {label && <p className="text-muted mt-2 font-medium font-mono text-xs uppercase tracking-widest">{label}</p>}
            </div>
        );
    }

    return (
        <span ref={ref} className={`${isVisible ? "opacity-100" : "opacity-0"} transition-opacity duration-700 ${className}`}>
            {count}{suffix}
        </span>
    );
}
