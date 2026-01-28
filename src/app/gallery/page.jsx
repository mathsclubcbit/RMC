"use client";

import { useState, useEffect } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import PageHeader from "@/components/ui/PageHeader";
import SectionDivider from "@/components/ui/SectionDivider";
import { Play, Maximize2, Loader2, ImageOff, X, Palette } from "lucide-react";
import Tilt from "react-parallax-tilt";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const galleryCategories = [
    { name: "All", count: 0 },
    { name: "Olympiads", count: 0 },
    { name: "Workshops", count: 0 },
    { name: "Fests", count: 0 },
    { name: "Fun Events", count: 0 },
];

const SYMBOLS = ["∑", "π", "∫", "ζ", "∞", "√", "Δ", "θ", "λ", "φ", "Ω", "α"];
const COLORS = ["teal", "lime", "coral", "orange"];

export default function GalleryPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState(galleryCategories);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const fetchImages = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("gallery_images")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching gallery:", error);
                setLoading(false);
                return;
            }

            // Transform data to match UI needs
            const mappedData = (data || []).map((img, index) => ({
                id: img.id,
                url: img.url,
                category: img.category || "General",
                title: img.caption || "Untitled",
                symbol: SYMBOLS[index % SYMBOLS.length],
                color: COLORS[index % COLORS.length],
                // Randomize height for masonry effect if not stored, otherwise use aspect ratio concept
                // For simplicity in this grid, we'll try to determine height class based on index or random
                height: index % 3 === 0 ? "h-80" : index % 2 === 0 ? "h-64" : "h-72"
            }));

            setImages(mappedData);

            // Update category counts
            const counts = galleryCategories.map(cat => {
                if (cat.name === "All") return { ...cat, count: mappedData.length };
                return {
                    ...cat,
                    count: mappedData.filter(img => img.category === cat.name).length
                };
            });
            setCategories(counts);
            setLoading(false);
        };

        fetchImages();
    }, []);

    const filteredItems = activeCategory === "All"
        ? images
        : images.filter(item => item.category === activeCategory);

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
                            {categories.map((cat, index) => (
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
                                    {cat.name} <span className="opacity-50 ml-1">({cat.count})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <SectionDivider type="theorem" number="V" text="Observed Data" />

                {/* Gallery Masonry Grid */}
                <section className="pb-32 min-h-[50vh]">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-teal-400 mb-4" />
                                <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Retrieving Data...</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
                                <ImageOff className="w-10 h-10 text-white/20 mb-4" />
                                <p className="text-white/40 font-mono text-xs uppercase tracking-widest">No visual data found for this category.</p>
                            </div>
                        ) : (
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
                                            onClick={() => setSelectedImage(item)}
                                            className={cn(
                                                "relative group overflow-hidden cursor-pointer rounded-2xl bg-white/5 border border-white/5 hover:border-teal/30 transition-all duration-700",
                                                item.height
                                            )}
                                        >
                                            {/* Background Image - The actual photo */}
                                            <Image
                                                src={item.url}
                                                alt={item.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />

                                            {/* Symbol Overlay - Reduced opacity so photo is visible */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay">
                                                <span className={`text-[8rem] font-serif italic font-black text-white/10 group-hover:text-white/20 transition-all duration-1000 select-none`}>
                                                    {item.symbol}
                                                </span>
                                            </div>

                                            {/* Gradient Overlay for Text Readability */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                                    <span className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        item.color === 'teal' ? 'bg-teal-400' :
                                                            item.color === 'lime' ? 'bg-lime-400' :
                                                                item.color === 'coral' ? 'bg-rose-400' : 'bg-amber-400'
                                                    )} />
                                                    <span className="text-xs font-mono uppercase tracking-widest text-muted">{item.category}</span>
                                                </div>

                                                <h3 className="text-white font-[family-name:var(--font-cinzel)] font-bold text-xl tracking-tight leading-none mb-4 group-hover:text-teal-50 transition-colors drop-shadow-md">{item.title}</h3>

                                                <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 group-hover:text-teal-400 transition-colors opacity-0 group-hover:opacity-100 duration-500 delay-200">
                                                    <Maximize2 className="w-3 h-3" />
                                                    <span>Expand View</span>
                                                </button>
                                            </div>
                                        </div>
                                    </Tilt>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Lightbox Modal */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div
                            className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full h-full">
                                <Image
                                    src={selectedImage.url}
                                    alt={selectedImage.title}
                                    fill
                                    className="object-contain"
                                    quality={100}
                                />
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <h3 className="text-white font-serif font-bold text-2xl text-center mb-1">{selectedImage.title}</h3>
                                <p className="text-white/50 text-center text-xs font-mono uppercase tracking-widest">{selectedImage.category}</p>
                            </div>
                        </div>
                    </div>
                )}

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
