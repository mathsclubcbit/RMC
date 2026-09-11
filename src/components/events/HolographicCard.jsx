"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Calendar, MapPin, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { isEventRegistrationClosed } from "@/lib/utils";

// Glitch Text Component for Hover Effects
const GlitchText = ({ text, className }) => {
    return (
        <span className={`relative inline-block group max-w-full break-words whitespace-normal ${className || ""}`}>
            <span className="relative z-10 break-words">{text}</span>
            <span className="absolute top-0 left-0 -ml-[2px] w-full h-full text-red-500 opacity-0 group-hover:opacity-70 group-hover:animate-pulse transition-opacity duration-100 z-0 break-words" aria-hidden="true">
                {text}
            </span>
        </span>
    );
};

export default function HolographicCard({ event, index }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const boundsRef = useRef(null);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
        if (!boundsRef.current) return;
        let { left, top } = boundsRef.current;

        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    function handleMouseEnter({ currentTarget }) {
        boundsRef.current = currentTarget.getBoundingClientRect();
    }

    function handleMouseLeave() {
        boundsRef.current = null;
    }

    // Determine which poster to show (fallback to img, then to null)
    const posterSrc = event.posterDesktop || event.posterMobile || event.img;
    const hasPoster = !!posterSrc;

    // Registration state
    const isPlacementSeries = event.eventType?.toLowerCase() === 'placement series';
    const isClosed = !isPlacementSeries && isEventRegistrationClosed(event);

    // Compute both motion backgrounds unconditionally (hooks can't be called conditionally)
    const closedBg = useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.04), transparent 80%)`;
    const openBg = useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(45, 212, 191, 0.15), transparent 80%)`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className={`group relative w-full overflow-hidden rounded-3xl bg-black border transition-colors duration-500 ${
                isClosed
                    ? "border-white/5 hover:border-white/10"
                    : "border-white/10 hover:border-teal/50"
            }`}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-30"
                style={{
                    background: isClosed ? closedBg : openBg,
                }}
            />

            <div className="absolute inset-0 z-0 bg-black">
                {hasPoster ? (
                    <div className="relative w-full h-full transition-transform duration-700 group-hover:scale-110 group-hover:blur-[3px] group-hover:opacity-80">
                        {/* Universal Image Handler with Fallbacks */}
                        <div className="hidden md:block absolute inset-0">
                            <Image
                                src={event.posterDesktop || event.img || event.posterMobile}
                                alt={event.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 50vw, 33vw"
                                priority={index === 0}
                                fetchPriority={index === 0 ? "high" : "auto"}
                            />
                        </div>
                        <div className="md:hidden absolute inset-0">
                            <Image
                                src={event.posterMobile || event.img || event.posterDesktop}
                                alt={event.title}
                                fill
                                className="object-cover"
                                sizes="100vw"
                                priority={index === 0}
                                fetchPriority={index === 0 ? "high" : "auto"}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50" />
                )}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                {/* Dynamic Gradient Overlay: Darker on Hover (Mobile: Always darker) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 lg:via-black/60 to-transparent transition-all duration-500 group-hover:via-black/90 group-hover:to-black/40" />
            </div>

            <div className="relative z-20 h-full p-6 md:p-8 flex flex-col justify-end items-center text-center min-h-[350px] md:min-h-[400px]">
                {/* Glitch/Tech Decoration */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                    {isClosed ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 border border-white/10 px-2 py-1 rounded-full uppercase tracking-widest bg-black/50 backdrop-blur-md">
                            <Lock className="w-2.5 h-2.5" />
                            Ended
                        </span>
                    ) : (
                        <span className="text-[10px] font-mono text-teal/50 border border-teal/20 px-2 py-1 rounded-full uppercase tracking-widest bg-black/50 backdrop-blur-md group-hover:bg-teal/10 transition-colors">
                            {event.eventType || event.category || event.status}
                        </span>
                    )}
                    <span className="text-4xl text-white/5 font-black italic select-none group-hover:text-white/10 group-hover:translate-x-1 transition-all duration-300">
                        0{index + 1}
                    </span>
                </div>

                <div className="space-y-4 translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 transition-transform duration-500 w-full flex flex-col items-center">
                    <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-widest font-mono">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-[family-name:var(--font-cinzel)] font-bold text-white leading-tight group-hover:text-teal transition-colors max-w-full break-words w-full px-2">
                        <GlitchText text={event.title} />
                    </h3>

                    <p className="text-white/60 text-xs md:text-sm line-clamp-2 max-w-sm group-hover:text-white/80 transition-colors font-serif italic">
                        {event.description}
                    </p>

                    <div className="pt-6 border-t border-white/10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-500 w-full">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 w-full min-w-0">
                            <div className="flex items-center gap-2 text-xs text-muted max-w-full min-w-0">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate min-w-0 flex-1 text-left sm:text-center">{event.location}</span>
                            </div>
                            {event.regEndDate && (
                                <div className="text-[10px] font-mono uppercase tracking-widest text-red-400/80 shrink-0">
                                    Reg Closes: {event.regEndDate}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center w-full mt-4">
                            {event.eventType?.toLowerCase() === 'quiz' ? (
                                null
                            ) : isClosed ? (
                                <div className="flex items-center gap-2 text-white/25 font-bold uppercase text-xs tracking-widest border border-white/8 px-6 py-2 rounded-full bg-white/[0.02] cursor-not-allowed select-none">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Registration Closed</span>
                                </div>
                            ) : (
                                <Link
                                    href={isPlacementSeries ? `/placement-series/${event.id}` : `/register/${event.id}`}
                                    className="flex items-center gap-2 text-white font-bold uppercase text-xs tracking-widest hover:text-teal transition-colors border border-white/20 hover:border-teal/50 px-6 py-2 rounded-full bg-white/5"
                                >
                                    <span>{isPlacementSeries ? 'View Series' : 'Register'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chromatic Aberration Border Effect */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none group-hover:shadow-[inset_0_0_20px_rgba(45,212,191,0.1)] transition-shadow duration-500" />
        </motion.div>
    );
}
