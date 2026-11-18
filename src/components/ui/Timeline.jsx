"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Timeline({ items }) {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <div className="w-full max-w-4xl mx-auto py-20 px-4 md:px-0" ref={containerRef}>
            {/* Central Spine */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-teal/50 to-transparent block h-full">
                <motion.div
                    style={{ height, background: "linear-gradient(180deg, rgba(58,188,179,0) 0%, rgba(58,188,179,1) 50%, rgba(58,188,179,0) 100%)" }}
                    className="w-full"
                />
            </div>

            <div className="relative space-y-12">
                {items.map((item, index) => (
                    <TimelineItem key={index} item={item} index={index} />
                ))}
            </div>
        </div>
    );
}

function TimelineItem({ item, index }) {
    const isEven = index % 2 === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={cn(
                "relative flex items-center justify-between md:justify-normal md:gap-8",
                isEven ? "md:flex-row-reverse" : "md:flex-row"
            )}
        >
            {/* Node */}
            <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-background border-2 border-teal z-10 box-content blur-[1px]">
                <div className="w-2 h-2 bg-teal rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Content Spacer for Desktop */}
            <div className="hidden md:block w-1/2" />

            {/* Card */}
            <div className={cn(
                "ml-12 md:ml-0 md:w-1/2 relative bg-card/20 backdrop-blur-md border border-white/5 p-6 rounded-xl hover:bg-card/40 transition-colors group flex flex-col items-start",
                isEven ? "items-end text-right" : "items-start text-left"
            )}>
                <div className={cn(
                    "absolute top-6 w-4 h-px bg-teal/50",
                    isEven ? "-right-4" : "-left-4 hidden md:block" // Connectors
                )} />

                <div className="flex flex-col gap-1 mb-2 w-full">
                    <span className={cn("text-xs font-bold font-mono tracking-widest text-teal", isEven ? "self-end" : "self-start")}>
                        {item.date}
                    </span>
                    {item.category && (
                        <span className={cn("text-[10px] uppercase tracking-[0.2em] text-muted/60", isEven ? "self-end" : "self-start")}>
                            {item.category}
                        </span>
                    )}
                </div>

                <h3 className="text-2xl font-serif font-bold text-foreground mb-3 leading-tight">{item.title}</h3>

                {item.description && (
                    <p className="text-muted text-sm leading-relaxed mb-6 max-w-sm">{item.description}</p>
                )}

                {item.href ? (
                    <Link href={item.href} target={item.href.startsWith("http") ? "_blank" : "_self"} className={cn("inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white hover:text-teal transition-colors mt-auto", isEven ? "flex-row-reverse" : "")}>
                        <span>{item.ctaLabel || "View Details"}</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <div className="h-4" /> /* Spacer if no link */
                )}
            </div>
        </motion.div>
    );
}
