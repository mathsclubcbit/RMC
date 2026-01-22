"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
// import { upcomingEvents } from "@/data/upcomingEvents"; // Removed static import
import HolographicCard from "@/components/events/HolographicCard";
import SectionTitle from "@/components/ui/SectionTitle";
import MathBackground from "@/components/ui/MathBackground";
import { Search, Filter } from "lucide-react";

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetch('/api/events')
            .then(res => res.json())
            .then(data => setEvents(data))
            .catch(err => console.error("Error fetching events:", err));
    }, []);

    const filteredEvents = events.filter(event => {
        const matchesFilter = filter === "all" || event.category === filter; // Assuming category exists or just mock
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-black relative overflow-visible">
            {/* Standard Math Background */}
            <MathBackground />

            <div className="max-w-7xl mx-auto relative z-10">

                <SectionTitle
                    title="EVENTS"
                    subtitle="Our Timeline"
                    align="center"
                />

                {/* Control Panel (Filter/Search) */}
                <div className="mb-16 mt-8 flex flex-col md:flex-row gap-4 items-center justify-between p-1 border-y border-white/10 py-6 bg-black/50 backdrop-blur-sm">

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
