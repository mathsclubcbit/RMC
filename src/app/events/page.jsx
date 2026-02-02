"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HolographicCard from "@/components/events/HolographicCard";
import SectionDivider from "@/components/ui/SectionDivider";
import EventsHero from "@/components/events/EventsHero";
import { Search, Terminal, X } from "lucide-react";

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for effect
        setTimeout(() => {
            fetch('/api/events')
                .then(res => res.json())
                .then(data => {
                    setEvents(data);
                    setIsLoading(false);
                })
                .catch(err => console.error("Error fetching events:", err));
        }, 1000); // Artificial delay for cinematic intro
    }, []);

    const filteredEvents = events.filter(event => {
        const matchesFilter = filter === "all" || (event.eventType || event.category).toLowerCase() === filter;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const categories = ["all", "competition", "workshop", "seminar", "guest talk", "hackathon", "ideathon"];

    return (
        <div className="min-h-screen bg-black selection:bg-teal/20 selection:text-teal font-sans">

            <EventsHero />

            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">

                {/* Command Interface */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group"
                >
                    {/* Decorative Scanner Line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal/50 to-transparent group-hover:scale-x-110 transition-transform duration-700" />

                    <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">

                        {/* Search Module */}
                        <div className="relative w-full lg:w-96 group/search">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-teal/40 group-focus-within/search:text-teal transition-colors">
                                <Terminal className="h-5 w-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Execute search command..."
                                className="block w-full pl-12 pr-4 py-4 border border-white/5 rounded-xl bg-white/5 text-white placeholder-white/20 font-mono text-sm focus:outline-none focus:border-teal/50 focus:bg-black/50 transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilter(cat)}
                                    className={`px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest border transition-all duration-300 relative overflow-hidden group/btn ${filter === cat
                                        ? "bg-teal/10 border-teal text-teal shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                                        : "border-white/5 text-white/40 hover:border-white/20 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <span className="relative z-10">{cat}</span>
                                    {filter === cat && (
                                        <div className="absolute inset-0 bg-teal/5 blur-md" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="py-16">
                    <SectionDivider type="axiom" text={`Showing ${filteredEvents.length} Active Protocol(s)`} />
                </div>

                {/* Event Grid */}
                <div className="pb-32 min-h-[50vh]">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-[400px] w-full rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            <AnimatePresence>
                                {filteredEvents.map((event, _index) => (
                                    <HolographicCard key={event.id} event={event} index={_index} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {!isLoading && filteredEvents.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-[40vh] flex flex-col items-center justify-center text-center border border-white/5 rounded-3xl bg-white/[0.02]"
                        >
                            <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                                <Search className="w-10 h-10 text-white/20" />
                            </div>
                            <h3 className="text-2xl font-[family-name:var(--font-cinzel)] text-white/50 mb-2">No Data Found</h3>
                            <p className="text-white/30 font-mono text-sm max-w-md mx-auto">
                                The requested protocol parameters returned zero results. Adjust your query.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
