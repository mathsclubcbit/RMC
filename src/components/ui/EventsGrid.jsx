"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function EventsGrid({ items }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-10">
            {items.map((item, index) => (
                <EventCard key={index} item={item} index={index} />
            ))}
        </div>
    );
}

function EventCard({ item, index }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative h-full flex flex-col bg-black/40 border border-white/5 hover:border-teal/30 rounded-2xl overflow-hidden transition-all duration-500 hover:bg-black/60 hover:-translate-y-1 hover:shadow-[0_0_30px_-10px_rgba(45,155,148,0.3)]"
        >
            {/* Spotlight Gradient Effect */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(45,155,148,0.15), transparent 40%)`
                }}
            />

            {/* Header / Date */}
            <div className="p-6 pb-0 flex items-center justify-between relative z-10">
                <span className="inline-flex items-center gap-2 text-xs font-mono font-bold text-teal tracking-widest uppercase bg-teal/5 px-2 py-1 rounded border border-teal/10">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                </span>

                {item.category && (
                    <span className="text-[10px] text-muted-foreground/60 tracking-wider uppercase border border-white/5 px-2 py-1 rounded">
                        {item.category}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow relative z-10">
                <h3 className="text-xl font-serif font-bold text-white mb-3 group-hover:text-teal transition-colors duration-300">
                    {item.title}
                </h3>

                {item.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                        {item.description}
                    </p>
                )}

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-teal/40 font-mono tracking-widest group-hover:text-teal/70 transition-colors">
                        EVENT ID: {String(item.id || index + 1).padStart(3, '0')}
                    </span>

                    {/* Fake CTA Arrow */}
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal group-hover:text-black transition-all duration-300 transform group-hover:rotate-[-45deg]">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Decorative Grid Background */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none" />
        </motion.div>
    );
}
