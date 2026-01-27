"use client";

import { useState } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import PageHeader from "@/components/ui/PageHeader";
import SectionDivider from "@/components/ui/SectionDivider";
import { Play, Maximize2 } from "lucide-react";
import Tilt from "react-parallax-tilt";
import { cn } from "@/lib/utils";

const galleryCategories = [
    { name: "All", count: 48 },
    { name: "Olympiads", count: 12 },
    { name: "Workshops", count: 10 },
    { name: "Fests", count: 15 },
    { name: "Fun Events", count: 11 },
];

const galleryItems = [
    { id: 1, category: "Olympiads", title: "Math Olympiad 2025", symbol: "∑", color: "teal", height: "h-64" },
    { id: 2, category: "Fests", title: "Shruthi Fest Quiz", symbol: "π", color: "lime", height: "h-80" },
    { id: 3, category: "Workshops", title: "Cryptography Workshop", symbol: "∫", color: "coral", height: "h-72" },
    { id: 4, category: "Fun Events", title: "Pi Day 2025", symbol: "ζ", color: "orange", height: "h-60" },
    { id: 5, category: "Olympiads", title: "Inter-college Competition", symbol: "∞", color: "teal", height: "h-72" },
    { id: 6, category: "Workshops", title: "Problem Solving Session", symbol: "√", color: "lime", height: "h-64" },
    { id: 7, category: "Fests", title: "Sudhee Math Event", symbol: "Δ", color: "coral", height: "h-96" },
    { id: 8, category: "Fun Events", title: "Treasure Hunt", symbol: "θ", color: "orange", height: "h-64" },
    { id: 9, category: "Olympiads", title: "National Math Day", symbol: "λ", color: "teal", height: "h-72" },
    { id: 10, category: "Workshops", title: "Guest Lecture Series", symbol: "φ", color: "lime", height: "h-80" },
    { id: 11, category: "Fests", title: "Annual Ceremony", symbol: "Ω", color: "coral", height: "h-64" },
    { id: 12, category: "Fun Events", title: "Math Quiz Night", symbol: "α", color: "orange", height: "h-72" },
];

export default function GalleryPage() {
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredItems = activeCategory === "All"
        ? galleryItems
        : galleryItems.filter(item => item.category === activeCategory);

    return (
        <div className="relative min-h-screen">

            <PageHeader
                title="VISUAL PROOFS"
                subtitle="A register of observed phenomena. The visual memories of our timeline."
            />

            <div className="relative z-10 px-4 sm:px-6 lg:px-8">

                {/* Filter Tabs */}
                <div className="sticky top-24 z-40 mb-16 pointer-events-none">
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                        <div className="bg-black/60 backdrop-blur-xl p-2 flex flex-wrap justify-center gap-2 rounded-full border border-white/10 shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)]">
                            {galleryCategories.map((cat, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveCategory(cat.name)}
                                    className={cn(
                                        "px-6 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
                                        activeCategory === cat.name
                                            ? "bg-teal text-black shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                                            : "text-muted hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <SectionDivider type="theorem" number="V" text="Observed Data" />

                {/* Gallery Masonry Grid */}
                <section className="pb-32">
                    <div className="max-w-7xl mx-auto">
                        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
                            {filteredItems.map((item) => (
                                <Tilt
                                    key={item.id}
                                    tiltMaxAngleX={5}
                                    tiltMaxAngleY={5}
                                    perspective={1000}
                                    scale={1.02}
                                    transitionSpeed={1500}
                                    className="break-inside-avoid"
                                >
                                    <div
                                        className={cn(
                                            "relative group overflow-hidden cursor-pointer rounded-2xl bg-white/5 border border-white/5 hover:border-teal/30 transition-all duration-700",
                                            item.height
                                        )}
                                    >
                                        {/* Symbol Icon as Background Art */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-all duration-700">
                                            <span className={`text-[10rem] font-serif italic font-black text-white/5 group-hover:text-${item.color}-400 group-hover:scale-110 transition-all duration-1000 select-none`}>
                                                {item.symbol}
                                            </span>
                                        </div>

                                        {/* Overlay Content */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    item.color === 'teal' ? 'bg-teal-400' :
                                                        item.color === 'lime' ? 'bg-lime-400' :
                                                            item.color === 'coral' ? 'bg-rose-400' : 'bg-amber-400'
                                                )} />
                                                <span className="text-xs font-mono uppercase tracking-widest text-muted">{item.category}</span>
                                            </div>

                                            <h3 className="text-white font-[family-name:var(--font-cinzel)] font-bold text-2xl tracking-tight leading-none mb-4 group-hover:text-teal-50 transition-colors">{item.title}</h3>

                                            <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 group-hover:text-teal-400 transition-colors opacity-0 group-hover:opacity-100 duration-500 delay-200">
                                                <Maximize2 className="w-3 h-3" />
                                                <span>Expand View</span>
                                            </button>
                                        </div>
                                    </div>
                                </Tilt>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Videos Section */}
                <section className="py-20 border-t border-white/5 relative bg-black/20 rounded-3xl mb-20">
                    <div className="max-w-7xl mx-auto px-4 md:px-12">
                        <SectionTitle
                            title="Recorded Transmissions"
                            subtitle="Archived playback of events."
                            center={true}
                        />
                        <div className="grid md:grid-cols-3 gap-10 mt-20">
                            {[
                                { title: "Math Olympiad Highlights", duration: "5:23", color: "teal", id: "01" },
                                { title: "Pi Day Celebrations", duration: "3:45", color: "lime", id: "02" },
                                { title: "RMC Annual Meet", duration: "8:12", color: "coral", id: "03" },
                            ].map((video, index) => (
                                <SpotlightCard
                                    key={index}
                                    color={video.color}
                                    className="aspect-video overflow-hidden relative group cursor-pointer bg-card/40 border-white/5 hover:border-teal/30"
                                >
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:bg-teal group-hover:border-teal transition-all duration-500">
                                            <Play className="w-6 h-6 text-white ml-1 fill-white" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent z-10">
                                        <h3 className="text-white font-serif font-bold text-lg group-hover:text-teal-200 transition-colors">{video.title}</h3>
                                        <p className="text-muted/60 font-mono text-xs uppercase tracking-widest mt-1">{video.duration} {"// REPLAY"}</p>
                                    </div>
                                </SpotlightCard>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
