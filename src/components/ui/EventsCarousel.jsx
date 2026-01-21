"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function EventsCarousel({ items }) {
    const carouselRef = useRef(null);

    return (
        <div className="relative w-full py-10">
            {/* Horizontal Timeline Axis line */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal/20 to-transparent -translate-y-1/2 hidden md:block" />

            <div
                className="flex overflow-x-auto gap-6 pb-12 pt-8 px-4 md:px-8 snap-x snap-mandatory scrollbar-hide"
                ref={carouselRef}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {items.map((item, index) => (
                    <CarouselCard key={index} item={item} index={index} />
                ))}

                {/* Spacer for end padding */}
                <div className="w-8 shrink-0" />
            </div>

            {/* Fade gradients for visual cue */}
            <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
    );
}

function CarouselCard({ item, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="relative shrink-0 w-[85vw] md:w-[400px] snap-center group"
        >
            {/* Timeline Dot (Desktop only) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-background border border-teal rounded-full z-10 hidden md:block group-hover:bg-teal group-hover:scale-150 transition-all duration-300">
                <div className="absolute inset-0 bg-teal/50 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Connecting Line to Card */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-teal/20 to-transparent hidden md:block
                ${index % 2 === 0 ? "top-1/2 h-16 bg-gradient-to-b" : "bottom-1/2 h-16 bg-gradient-to-t"}`}
            />

            {/* Card Content - Different vertical alignment for rhythm */}
            <div className={cn(
                "relative flex flex-col h-full bg-card/10 backdrop-blur-md border border-white/5 p-6 rounded-2xl hover:border-teal/30 hover:bg-card/20 transition-all duration-300 group-hover:shadow-[0_0_30px_-5px_rgba(45,155,148,0.1)]",
                index % 2 === 0 ? "md:mt-16" : "md:mb-16"
            )}>
                {/* Date Badge */}
                <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/5 border border-teal/10 text-teal text-xs font-mono tracking-widest uppercase">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                    </span>
                    {item.category && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 border border-white/5 px-2 py-1 rounded">
                            {item.category}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-2 group-hover:text-teal transition-colors line-clamp-2">
                    {item.title}
                </h3>

                {/* Description */}
                {item.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3 flex-grow">
                        {item.description}
                    </p>
                )}

                {/* Spacer if no description/short description to push CTA down */}
                <div className="flex-grow" />

                {/* Actions */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                    {/* href can be empty now, user removed links. Check if exists */}
                    {/* Actually user removed 'links: []' array but likely kept 'href' if it existed in page.jsx. 
                        In eventsData.js, there is NO 'href' field. 
                        In page.jsx 'featuredEvents' had 'href'.
                        I will assume 'item.href' might not be present for all. */}
                    {item.href ? (
                        <Link href={item.href} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors group/link">
                            <span>Explore Event</span>
                            <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <span className="text-[10px] text-muted-foreground italic">Event Concluded</span>
                    )}
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
            </div>
        </motion.div>
    );
}
