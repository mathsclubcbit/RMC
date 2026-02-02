"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import SectionTitle from "@/components/ui/SectionTitle";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const galleryImages = [
    { src: "/images/event1.jpg", alt: "Math Fest 2024", speed: 1 },
    // Using placeholders or assuming images exist. If not, I'll use colored divs with math symbols.
    // For safety, I'll use div placeholders if images fail, but let's try to structure it for real images.
];

// Placeholder for images (since I don't have actual files, I'll generate stylish divs)
const GalleryItem = ({ i, speed }) => {
    // Generate deterministic "random" colors/stats based on index
    const hue = (i * 137.508) % 360;
    return (
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 group cursor-none">
            {/* Fallback visual */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"
            />

            {/* Abstract Math Art */}
            <div className="absolute inset-0 opacity-30 mix-blend-overlay"
                style={{
                    backgroundImage: `radial-gradient(circle at ${i % 2 * 100}% ${i % 3 * 100}%, hsla(${hue}, 70%, 50%, 0.2), transparent)`,
                }}
            />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />

            {/* Symbol */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-serif text-white/10 group-hover:text-teal/50 transition-colors duration-500">
                    {["∑", "∫", "∂", "∇", "∆", "∏", "∞", "∅", "∉"][i % 9]}
                </span>
            </div>

            {/* Hover Reveal Info */}
            <div className="absolute inset-0 bg-teal/90 translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex flex-col items-center justify-center p-6 text-center">
                <span className="font-mono text-xs uppercase tracking-widest text-black mb-2">Exhibit 00{i + 1}</span>
                <span className="font-serif text-2xl text-black font-bold">Concept Visual</span>
                <span className="text-black/60 text-sm mt-2">Captured during the 202{i % 5} symposium.</span>
            </div>
        </div>
    );
};

export default function ParallaxGallery() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]); // Reverse direction/speed
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <section ref={containerRef} className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-12 md:mb-20">
                    <SectionTitle
                        title="Visual Proof"
                        subtitle="A photographic record of our logical explorations."
                        variant="silver"
                        center={true}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 h-[520px] md:h-[800px] overflow-hidden rounded-3xl bg-white/5 border border-white/5 p-4 md:p-8 relative">
                    {/* Vignette */}
                    <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] rounded-3xl" />

                    {/* Column 1 */}
                    <motion.div style={{ y: y1 }} className="flex flex-col gap-8">
                        {[1, 2, 3].map((i) => (
                            <GalleryItem key={i} i={i} />
                        ))}
                    </motion.div>

                    {/* Column 2 (Offset start) */}
                    <motion.div style={{ y: y2 }} className="flex flex-col gap-8 -mt-20">
                        {[4, 5, 6].map((i) => (
                            <GalleryItem key={i} i={i} />
                        ))}
                    </motion.div>

                    {/* Column 3 */}
                    <motion.div style={{ y: y3 }} className="flex flex-col gap-8">
                        {[7, 8, 9].map((i) => (
                            <GalleryItem key={i} i={i} />
                        ))}
                    </motion.div>
                </div>

                <div className="flex justify-center mt-8 md:mt-12">
                    <Link href="/gallery" className="group flex items-center gap-3 text-white/50 hover:text-teal transition-colors uppercase tracking-widest text-sm font-bold">
                        <span>Enter Full Gallery</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
