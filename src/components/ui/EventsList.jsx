"use client";

import { useState, useMemo } from "react";
import EventCard from "@/components/ui/EventCard";
import EventFilters from "@/components/ui/EventFilters";

export default function EventsList({ events }) {
    const [visibleCount, setVisibleCount] = useState(9); // Initial load count
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedYear, setSelectedYear] = useState("All");

    // Extract unique categories and years for filter dropdowns
    const categories = useMemo(() => {
        const cats = new Set(events.map(e => e.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [events]);

    const years = useMemo(() => {
        const yrs = new Set(events.map(e => e.year).filter(Boolean));
        return Array.from(yrs).sort().reverse();
    }, [events]);

    // Filter Logic
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesSearch =
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
            const matchesYear = selectedYear === "All" || event.year === selectedYear;

            return matchesSearch && matchesCategory && matchesYear;
            // Sort by ID descending (newest first)
        }).sort((a, b) => b.id - a.id);
    }, [events, searchQuery, selectedCategory, selectedYear]);

    // Pagination Logic
    const visibleEvents = filteredEvents.slice(0, visibleCount);
    const hasMore = visibleCount < filteredEvents.length;

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 9);
    };

    return (
        <div className="flex flex-col items-center w-full">
            <EventFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                categories={categories}
                years={years}
            />

            {filteredEvents.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">No events found</h3>
                    <p className="text-muted">Try adjusting your search or filters</p>
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("All");
                            setSelectedYear("All");
                        }}
                        className="mt-6 text-teal hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
                        {visibleEvents.map((event, index) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                color={["teal", "lime", "coral", "orange"][index % 4]}
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <button
                            onClick={handleLoadMore}
                            className="px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all hover:scale-105 active:scale-95 scroll-mt-20"
                        >
                            Load More Events ({filteredEvents.length - visibleCount} remaining)
                        </button>
                    )}

                    {!hasMore && filteredEvents.length > 0 && (
                        <p className="text-muted text-sm mt-4">Showing all {filteredEvents.length} events</p>
                    )}
                </>
            )}
        </div>
    );
}
