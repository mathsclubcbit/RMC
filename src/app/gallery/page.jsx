"use client";

import { useState, useEffect } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import GalleryHero from "@/components/gallery/GalleryHero";
import SectionDivider from "@/components/ui/SectionDivider";
import { Play, Loader2, ImageOff, Calendar, ArrowRight, ImageIcon } from "lucide-react";
import Tilt from "react-parallax-tilt";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

const galleryCategories = [
    { name: "All", count: 0 },
    { name: "Olympiads", count: 0 },
    { name: "Workshops", count: 0 },
    { name: "Fests", count: 0 },
    { name: "Fun Events", count: 0 },
];

export default function GalleryPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState(galleryCategories);

    useEffect(() => {
        const fetchEvents = async () => {
            const supabase = createClient();
            // Fetch EVENTS (Albums) instead of images
            const { data, error } = await supabase
                .from("gallery_events")
                .select("*")
                .order("event_date", { ascending: false });

            if (error) {
                console.error("Error fetching gallery events:", error);
                setLoading(false);
                return;
            }

            const mappedEvents = (data || []).map((evt) => ({
                id: evt.id,
                title: evt.title,
                description: evt.description,
                category: evt.category || "General",
                date: evt.event_date,
                coverImage: evt.cover_image,
            }));

            setEvents(mappedEvents);

            // Update category counts
            const counts = galleryCategories.map(cat => {
                if (cat.name === "All") return { ...cat, count: mappedEvents.length };
                return {
                    ...cat,
                    count: mappedEvents.filter(evt => evt.category === cat.name).length
                };
            });
            setCategories(counts);
            setLoading(false);
        };

        fetchEvents();
    }, []);

    const filteredEvents = activeCategory === "All"
        ? events
        : events.filter(evt => evt.category === activeCategory);

    return (
        <div className="relative min-h-screen">

            <GalleryHero
                title="OUR GALLERY"
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

                {/* Event Albums Grid */}
                <section className="pb-32 min-h-[50vh]">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-teal-400 mb-4" />
                                <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Retrieving Archives...</p>
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
                                <ImageOff className="w-10 h-10 text-white/20 mb-4" />
                                <p className="text-white/40 font-mono text-xs uppercase tracking-widest">No archives found for this category.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredEvents.map((evt) => (
                                    <Tilt
                                        key={evt.id}
                                        tiltMaxAngleX={3}
                                        tiltMaxAngleY={3}
                                        perspective={1000}
                                        scale={1.02}
                                        transitionSpeed={1500}
                                        className="h-full"
                                    >
                                        <Link href={`/gallery/${evt.id}`} className="block h-full">
                                            <div className="relative h-full group overflow-hidden cursor-pointer rounded-2xl bg-white/5 border border-white/5 hover:border-teal/30 transition-all duration-500 flex flex-col">

                                                {/* Cover Image */}
                                                <div className="relative aspect-[4/3] overflow-hidden">
                                                    {evt.coverImage ? (
                                                        <Image
                                                            src={evt.coverImage}
                                                            alt={evt.title}
                                                            fill
                                                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-white/20">
                                                            <ImageIcon className="w-12 h-12" />
                                                        </div>
                                                    )}

                                                    {/* Date Overlay */}
                                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                                        <Calendar className="w-3 h-3 text-teal-400" />
                                                        <span className="text-[10px] font-mono font-bold text-white/90">
                                                            {new Date(evt.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>

                                                    {/* Category Tag */}
                                                    <div className="absolute top-4 right-4 bg-teal-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-teal-500/30">
                                                        <span className="text-[10px] font-mono font-bold text-teal-200 uppercase tracking-wider">
                                                            {evt.category}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-transparent to-black/40">
                                                    <h3 className="text-2xl font-serif font-bold text-white mb-2 group-hover:text-teal-200 transition-colors">
                                                        {evt.title}
                                                    </h3>
                                                    <p className="text-white/60 text-sm line-clamp-2 mb-6 flex-grow">
                                                        {evt.description}
                                                    </p>

                                                    <div className="flex items-center text-teal-400 text-xs font-bold uppercase tracking-widest gap-2 group-hover:gap-3 transition-all">
                                                        <span>View Gallery</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </Tilt>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Videos Section
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
                </section> */}
            </div>
        </div>
    );
}
