"use client";

import { useEffect, useMemo, useState } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import EventsList from "@/components/ui/EventsList"; // Fallback/Alternative view
import Link from "next/link";
import TimeWarpHero from "@/components/events/TimeWarpHero";
import Timeline from "@/components/ui/Timeline";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsClient() {
    const [activeTab, setActiveTab] = useState("upcoming");
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetch("/api/events")
            .then((res) => res.json())
            .then((data) => setEvents(Array.isArray(data) ? data : []))
            .catch(() => setEvents([]));
    }, []);

    const { upcomingEvents, pastEvents } = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const normalized = (events || []).map((e) => ({
            ...e,
            date: e?.startDate || e?.date || "",
        }));

        const upcoming = normalized
            .filter((e) => String(e?.date || "") >= today)
            .sort((a, b) => String(a?.date || "").localeCompare(String(b?.date || "")));

        const past = normalized
            .filter((e) => e?.date && String(e?.date || "") < today)
            .sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")));

        return { upcomingEvents: upcoming, pastEvents: past };
    }, [events]);

    // Transform upcoming events for Timeline
    const upcomingTimelineItems = upcomingEvents.map(e => ({
        date: e.date,
        title: e.title,
        description: e.description,
        category: e.category,
        href: (e.status || "").toLowerCase().includes("open") ? `/register/${e.id}` : null,
        ctaLabel: (e.status || "").toLowerCase().includes("open") ? "Register Now" : "Details"
    }));

    // Transform archive events for Timeline (reversed order for latest first)
    // Taking last 20 for performance in timeline view
    const archiveTimelineItems = [...pastEvents].slice(0, 20).map(e => ({
        date: e.date,
        title: e.title,
        description: e.description || `Participants: ${e.participants}`,
        category: e.category,
        href: null,
        ctaLabel: "Details"
    }));

    return (
        <div className="relative min-h-screen bg-background">
            {/* Time Warp Hero */}
            <TimeWarpHero />

            {/* Main Content */}
            <section className="pb-20 px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                <div className="max-w-7xl mx-auto">

                    {/* Tabs */}
                    <div className="flex justify-center mb-12">
                        <div className="bg-black/50 backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-2xl">
                            <button
                                onClick={() => setActiveTab("upcoming")}
                                className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "upcoming"
                                    ? "bg-teal text-black shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                                    : "text-muted hover:text-white"
                                    }`}
                            >
                                Upcoming
                            </button>
                            <button
                                onClick={() => setActiveTab("past")}
                                className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "past"
                                    ? "bg-teal text-black shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                                    : "text-muted hover:text-white"
                                    }`}
                            >
                                Archive
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {activeTab === "upcoming" ? (
                                <motion.div
                                    key="upcoming"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <SectionTitle
                                        title="Imminent Events"
                                        subtitle="The future of RMC is approaching."
                                        className="text-center mb-20"
                                    />
                                    <Timeline items={upcomingTimelineItems} />

                                    {/* Host Event Callout */}
                                    <div className="mt-20 max-w-4xl mx-auto p-8 md:p-12 rounded-3xl bg-gradient-to-br from-purple-900/20 to-black border border-white/10 text-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-noise opacity-10"></div>
                                        <div className="relative z-10">
                                            <h3 className="text-3xl font-serif font-bold mb-4">Propose an Event</h3>
                                            <p className="text-muted text-lg mb-8 max-w-2xl mx-auto font-light">
                                                Have a concept for a mathematical challenge or workshop?
                                                <br />Initiate a new vector in our timeline.
                                            </p>
                                            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform text-xs uppercase tracking-widest">
                                                Submit Proposal
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="past"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <SectionTitle
                                        title="Historical Data"
                                        subtitle="A record of past operations."
                                        className="text-center mb-20"
                                    />
                                    {/* Using Timeline for recent archive items */}
                                    <Timeline items={archiveTimelineItems} />

                                    <div className="text-center mt-12">
                                        <button className="text-muted hover:text-teal underline underline-offset-4 text-sm font-mono uppercase tracking-widest">
                                            Load Full Database
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </section>
        </div>
    );
}
