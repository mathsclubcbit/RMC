"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { upcomingEvents } from "@/data/upcomingEvents";
import HolographicCard from "@/components/events/HolographicCard";
import SectionTitle from "@/components/ui/SectionTitle";
import { Search, Filter } from "lucide-react";

export default function EventsPage() {
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEvents = upcomingEvents.filter(event => {
        const matchesFilter = filter === "all" || event.category === filter; // Assuming category exists or just mock
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-black relative overflow-visible">
            {/* Background Matrix/Grid - darker/subtle */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none fixed" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-16">
                    {/* Custom Header with Cinzel Font */}
                    <div className="mb-16 text-center">
                        <h1
                            className="text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-widest pb-2"
                            style={{ fontFamily: 'var(--font-cinzel)' }}
                        >
                            EVENTS
                        </h1>

                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 text-teal/40 font-mono text-xs">
                                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-teal/40"></span>
                                <span>//</span>
                                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-teal/40"></span>
                            </div>
                            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed font-sans">
                                Explore our timeline of mathematical endeavors.
                            </p>
                        </div>
                    </div>

                    {/* Control Panel (Filter/Search) */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-1 border-y border-white/10 py-6 bg-black/50 backdrop-blur-sm">

                        {/* Search */}
                        <div className="relative w-full md:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within:text-teal transition-colors">
                                <Search className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search operations..."
                                className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-white/5 text-white placeholder-muted focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 sm:text-sm transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                            {["all", "workshops", "competitions", "seminars"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest border transition-all whitespace-nowrap ${filter === tab
                                        ? "bg-teal/10 border-teal text-teal shadow-[0_0_10px_rgba(45,212,191,0.2)]"
                                        : "border-white/10 text-muted hover:border-white/30 hover:text-white"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Event Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {filteredEvents.map((event, index) => (
                        <HolographicCard key={event.id} event={event} index={index} />
                    ))}

                    {filteredEvents.length === 0 && (
                        <div className="col-span-full py-20 text-center text-muted font-mono">
                            No operations found matching criteria.
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
