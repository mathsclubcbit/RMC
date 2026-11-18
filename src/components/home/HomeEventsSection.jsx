"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
// import { upcomingEvents } from "@/data/upcomingEvents"; // Removed static import
import SectionTitle from "@/components/ui/SectionTitle";
import HolographicCard from "@/components/events/HolographicCard";

export default function HomeEventsSection({ initialEvents = [] }) {
    const [events, setEvents] = useState(initialEvents);

    useEffect(() => {
        // Only fetch if no initial data (fallback)
        if (initialEvents.length === 0) {
            fetch('/api/events')
                .then(res => res.json())
                .then(data => setEvents(data))
                .catch(err => console.error("Error fetching events:", err));
        }
    }, [initialEvents]);

    return (
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative bg-black overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.05),transparent_70%)] pointer-events-none" />

            {/* Timeline Flow Line */}
            <div className="absolute md:left-1/2 left-8 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-teal/10 to-transparent pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6 relative">
                    {/* Decorative Node on Timeline */}
                    <div className="absolute -left-[calc(2rem+1px)] md:left-[calc(50%-4px)] top-1/2 w-2 h-2 rounded-full bg-teal shadow-[0_0_10px_rgba(45,212,191,0.5)] hidden md:block" />

                    <SectionTitle
                        title="Upcoming Events"
                        subtitle="Join the next generation of mathematical explorers."
                        variant="silver"
                        className="mb-0"
                    />

                    <Link
                        href="/events"
                        className="hidden md:flex group items-center gap-2 text-sm font-mono uppercase tracking-widest text-muted hover:text-white transition-colors pb-2"
                    >
                        <span>View All Timeline</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event, index) => (
                        <HolographicCard key={event.id} event={event} index={index} />
                    ))}

                    {/* Link Card for Mobile */}
                    <Link href="/events" className="md:hidden group relative w-full overflow-hidden rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center min-h-[150px]">
                        <div className="flex items-center gap-2 text-white font-bold uppercase text-sm tracking-widest">
                            <span>View All Events</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}
