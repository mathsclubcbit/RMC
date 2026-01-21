"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import Link from "next/link";

// Glitch Text Component for Hover Effects
const GlitchText = ({ text, className }) => {
    return (
        <div className={`relative group ${className}`}>
            <span className="relative z-10">{text}</span>
            <span className="absolute top-0 left-0 -ml-[2px] text-red-500 opacity-0 group-hover:opacity-70 group-hover:animate-pulse transition-opacity duration-100 z-0">
                {text}
            </span>
            <span className="absolute top-0 left-0 ml-[2px] text-blue-500 opacity-0 group-hover:opacity-70 group-hover:animate-pulse transition-opacity duration-100 delay-75 z-0">
                {text}
            </span>
        </div>
    );
};

export default function HolographicCard({ event, index }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
        let { left, top } = currentTarget.getBoundingClientRect();

        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group relative w-full overflow-hidden rounded-3xl bg-black border border-white/10 hover:border-teal/50 transition-colors duration-500"
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-30"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                          650px circle at ${mouseX}px ${mouseY}px,
                          rgba(45, 212, 191, 0.15),
                          transparent 80%
                        )
                      `,
                }}
            />

            {/* Image Background with Gradient Overlay & Chromatic Noise */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </div>

            <div className="relative z-20 h-full p-8 flex flex-col justify-end min-h-[400px]">
                {/* Glitch/Tech Decoration */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                    <span className="text-[10px] font-mono text-teal/50 border border-teal/20 px-2 py-1 rounded-full uppercase tracking-widest bg-black/50 backdrop-blur-md group-hover:bg-teal/10 transition-colors">
                        {event.status}
                    </span>
                    <span className="text-4xl text-white/5 font-black italic select-none group-hover:text-white/10 group-hover:translate-x-1 transition-all duration-300">
                        0{index + 1}
                    </span>
                </div>

                <div className="space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-widest">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                    </div>

                    <h3 className="text-3xl font-serif font-bold text-white leading-tight group-hover:text-teal transition-colors">
                        <GlitchText text={event.title} />
                    </h3>

                    <p className="text-muted text-sm line-clamp-2 max-w-sm group-hover:text-white/80 transition-colors">
                        {event.description}
                    </p>

                    <div className="pt-6 flex items-center justify-between border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                        </div>

                        <Link
                            href={`/register/${event.id}`}
                            className="flex items-center gap-2 text-white font-bold uppercase text-xs tracking-widest hover:text-teal transition-colors"
                        >
                            <span>Register</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Chromatic Aberration Border Effect */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none group-hover:shadow-[inset_0_0_20px_rgba(45,212,191,0.1)] transition-shadow duration-500" />
        </motion.div>
    );
}
