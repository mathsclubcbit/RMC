"use client";

import { useState, useEffect, use } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SectionDivider from "@/components/ui/SectionDivider";
import { Maximize2, Loader2, ImageOff, X, ArrowLeft, Calendar, Tag } from "lucide-react";
import Tilt from "react-parallax-tilt";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Symbols/Colors for visual consistency
const SYMBOLS = ["∑", "π", "∫", "ζ", "∞", "√", "Δ", "θ", "λ", "φ", "Ω", "α"];
const COLORS = ["teal", "lime", "coral", "orange"];

export default function EventGalleryPage({ params }) {
    // Determine how to handle params. `use(params)` is a React pattern sometimes used in Next.js, 
    // but straight prop access is simpler if it's available. Given Next.js 14/15 changes, let's treat it as a promise if needed.
    // For now, assuming basic Next.js app router behavior.

    // Note: In latest Next.js versions, params is a Promise. Let's unwrap it safely.
    // However, since we are "use client", we might receive it as a prop.
    // Let's use `use()` if available or just state.

    // *Safest Implementation Strategy*: Since I am in a Client Component, I will await params if it's a promise, 
    // but simplified via useEffect for this specific user setup.
    // Actually, let's just use the `use` hook if we were on React 19/Canary, but simpler to just async access or prop access.

    // Let's stick to standard unwrapping pattern for Client Components if passed as prop.
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;

    const [event, setEvent] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            const supabase = createClient();
            setLoading(true);

            try {
                // 1. Fetch Event Details
                const { data: eventData, error: eventError } = await supabase
                    .from("gallery_events")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (eventError || !eventData) {
                    console.error("Event not found:", eventError);
                    setLoading(false);
                    return; // Should probably redirect or 404
                }

                setEvent(eventData);

                // 2. Fetch Images for this Event
                const { data: imgData, error: imgError } = await supabase
                    .from("gallery_images")
                    .select("*")
                    .eq("event_id", id)
                    .order("created_at", { ascending: false });

                if (imgError) console.error("Error fetching images:", imgError);

                // Map images for the grid
                const mappedImages = (imgData || []).map((img, index) => ({
                    id: img.id,
                    url: img.url, // Original for lightbox
                    thumbnail: img.url.includes('cloudinary')
                        ? img.url.replace('/upload/', '/upload/w_600,q_auto,f_auto/')
                        : img.url,
                    width: img.width,
                    height: img.height,
                    // Visual props
                    symbol: SYMBOLS[index % SYMBOLS.length],
                    color: COLORS[index % COLORS.length],
                    // Determine grid height class
                    heightClass: index % 3 === 0 ? "h-80" : index % 2 === 0 ? "h-64" : "h-72"
                }));

                setImages(mappedImages);

            } catch (err) {
                console.error("Error loading gallery:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-teal-400 mb-4" />
                <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Decryption in progress...</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black">
                <div className="text-white/50 mb-4">Event Data Not Found</div>
                <Link href="/gallery" className="text-teal-400 hover:text-teal-300 flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Archives
                </Link>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black">

            {/* Headers */}
            <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <Link href="/gallery" className="inline-flex items-center gap-2 text-white/40 hover:text-teal-400 transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-mono text-xs uppercase tracking-widest">Return to Archives</span>
                </Link>

                <h1 className="text-4xl md:text-6xl font-serif font-black text-white leading-tight mb-6">
                    {event.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 mb-8 text-sm font-mono text-white/60">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-500" />
                        <span>{new Date(event.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-teal-500" />
                        <span className="uppercase tracking-wider">{event.category}</span>
                    </div>
                </div>

                <div className="prose prose-invert max-w-3xl prose-lg">
                    <p className="text-white/70 leading-relaxed font-light">{event.description}</p>
                </div>
            </div>

            <SectionDivider type="theorem" number="Ω" text="Captured Data" />

            {/* Masonry Grid */}
            <section className="pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
                            <ImageOff className="w-10 h-10 text-white/20 mb-4" />
                            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">No visual data recorded for this event.</p>
                        </div>
                    ) : (
                        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
                            {images.map((item) => (
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
                                            "relative group overflow-hidden rounded-2xl bg-white/5 border border-white/5 hover:border-teal/30 transition-all duration-700",
                                            item.heightClass
                                        )}
                                    >
                                        <Image
                                            src={item.thumbnail || item.url}
                                            alt="gallery image"
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />

                                        {/* Symbol Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay">
                                            <span className="text-[8rem] font-serif italic font-black text-white/10 group-hover:text-white/20 transition-all duration-1000 select-none">
                                                {item.symbol}
                                            </span>
                                        </div>
                                    </div>
                                </Tilt>
                            ))}
                        </div>
                    )}
                </div>
            </section>


        </div>
    );
}
