"use client";

import Counter from "@/components/ui/Counter";
import { useInView } from "framer-motion";
import { useRef } from "react";

const StatItem = ({ end, label, suffix = "" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <div ref={ref} className="text-center px-2 md:px-4 group cursor-default">
            <div className="relative inline-block">
                <div className="text-4xl md:text-6xl font-bold font-serif text-white mb-2 group-hover:text-teal transition-colors duration-500">
                    {isInView ? <Counter end={end} suffix={suffix} color="currentColor" /> : 0}
                </div>
                {/* Decoration */}
                <div className="absolute -inset-4 bg-teal/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
            </div>
            <p className="text-[10px] md:text-xs font-mono text-teal/60 tracking-[0.2em] uppercase group-hover:text-white/60 transition-colors duration-500">
                {label}
            </p>
        </div>
    );
};

export default function StatsSection() {
    return (
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-black/40 backdrop-blur-md relative z-20">
            {/* Background Noise */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-0 relative">
                    {/* Vertical Dividers for Desktop */}
                    <div className="absolute top-0 bottom-0 left-1/3 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent hidden md:block" />
                    <div className="absolute top-0 bottom-0 left-2/3 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent hidden md:block" />

                    <StatItem end={56} label="Events Hosted" suffix="+" />
                    <StatItem end={200} label="Active Members" suffix="+" />
                    <div className="col-span-2 md:col-span-1">
                        <StatItem end={7} label="Years Legacy" />
                    </div>
                </div>
            </div>
        </section>
    );
}
