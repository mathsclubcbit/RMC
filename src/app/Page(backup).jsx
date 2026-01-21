"use client";

import Link from "next/link";
import Image from "next/image";
import MathSymbols from "@/components/ui/MathSymbols";
import Counter from "@/components/ui/Counter";
import CinematicHero from "@/components/home/CinematicHero";
import SpotlightCard from "@/components/ui/SpotlightCard";
import SectionTitle from "@/components/ui/SectionTitle";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import EventsGrid from "@/components/ui/EventsGrid";
import { eventsData } from "@/data/eventsData";
import { ArrowRight, Trophy, Calendar, Users, Star, TrendingUp } from "lucide-react";

// Select the last 10 events (most recent/upcoming) for the showcase
const upcomingEvents = eventsData.slice(-10).reverse();

import MathDerivation from "@/components/ui/MathDerivation";


import MathBackground from "@/components/ui/MathBackground";

export default function Home() {
    return (
        <div className="relative overflow-x-hidden min-h-screen">
            <MathBackground />
            <div className="fixed inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-background/10 to-background/80" />

            {/* Hero Section - The Event Horizon */}
            <CinematicHero />

            {/* Philosophy Grid (Bento) */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto mb-16">
                    <SectionTitle
                        title="The Legacy of Infinity"
                        subtitle="Inspired by Srinivasa Ramanujan, we foster a community where mathematics transcends calculations to become art."
                        center={true}
                        gradient={true}
                    />
                </div>

                <BentoGrid>
                    {/* Item 1: The Vision (Large) */}
                    <BentoGridItem
                        className="md:col-span-2 group"
                        title="Our Vision"
                        description={
                            <span className="text-sm md:text-base leading-relaxed text-muted-foreground">
                                From Math Olympiads to puzzle hunts, from guest lectures to fun quizzes —
                                we bring the magic of mathematics to life. Join us in exploring the
                                <span className="text-teal font-medium"> infinite </span>
                                beauty of numbers.
                            </span>
                        }
                        header={
                            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-teal/10 to-transparent relative overflow-hidden transition-all duration-500 group-hover:bg-teal/20">
                                {/* Intense Glow Overlay */}
                                <div className="absolute inset-0 bg-teal/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                {/* Decorative Golden Spiral Approximation */}
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 border border-teal/20 rounded-full opacity-50 group-hover:border-teal/50 group-hover:scale-110 transition-all duration-700" />
                                <div className="absolute -right-2 -bottom-2 w-28 h-28 border border-white/10 rounded-full opacity-50 group-hover:border-teal/30 transition-colors duration-700" />
                                <div className="absolute right-10 bottom-10 w-16 h-16 border border-teal/30 rounded-full opacity-50" />
                                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03] group-hover:opacity-10 transition-opacity"></div>
                            </div>
                        }
                        icon={<Star className="h-6 w-6 text-teal group-hover:text-white transition-colors" />}
                    />

                    {/* Item 2: Sigma (Community) */}
                    <BentoGridItem
                        className="md:col-span-1 group"
                        title="Community (∑)"
                        description="A summation of diverse minds coming together to solve complex problems."
                        header={
                            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-black/40 border border-white/5 items-center justify-center relative overflow-hidden group-hover:bg-teal/10 transition-colors duration-500">
                                <div className="absolute inset-0 bg-teal/5 blur-2xl group-hover:bg-teal/20 transition-colors duration-500" />
                                <span className="relative text-7xl font-serif text-white/20 group-hover:text-teal group-hover:scale-110 transition-all duration-500">∑</span>
                            </div>
                        }
                        icon={<Users className="h-4 w-4 text-muted-foreground group-hover:text-teal" />}
                    />

                    {/* Item 3: Integral (Growth) */}
                    <BentoGridItem
                        className="md:col-span-1 group"
                        title="Growth (∫)"
                        description="Continuous accumulation of knowledge and skills over time."
                        header={
                            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-black/40 border border-white/5 items-center justify-center relative overflow-hidden group-hover:bg-lime/10 transition-colors duration-500">
                                <div className="absolute inset-0 bg-lime/5 blur-2xl group-hover:bg-lime/20 transition-colors duration-500" />
                                <span className="relative text-7xl font-serif text-white/20 group-hover:text-lime group-hover:scale-110 transition-all duration-500">∫</span>
                            </div>
                        }
                        icon={<TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-lime" />}
                    />

                    {/* Item 4: The Archive (Resources) - Nav Link */}
                    <Link href="/resources" className="md:col-span-2">
                        <BentoGridItem
                            className="h-full cursor-pointer group hover:border-teal/50 transition-colors"
                            title={<span className="text-xl group-hover:text-teal transition-colors">The Archive (Ω)</span>}
                            description="Unlock a treasure trove of theorems, paradoxes, and puzzles. Dive into our digital library."
                            header={
                                <div className="h-full min-h-[6rem] w-full rounded-xl bg-gradient-to-r from-teal/5 via-blue-900/10 to-purple-900/10 flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:bg-teal/20 group-hover:shadow-[0_0_30px_-5px_rgba(45,155,148,0.3)]">
                                    {/* Glow Overlay */}
                                    <div className="absolute inset-0 bg-teal/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    {/* Noise/Texture replaced with gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                    {/* Fallback pattern if image missing: Random Numbers */}
                                    <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-4 opacity-10 select-none overflow-hidden text-[10px] font-mono leading-none text-teal">
                                        {Array.from({ length: 100 }).map((_, i) => (
                                            <span key={i} className="animate-pulse" style={{ animationDelay: `${Math.random() * 2}s` }}>
                                                {Math.random() > 0.5 ? "1" : "0"}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 text-white/50 group-hover:text-white transition-colors duration-300 relative z-10">
                                        <span className="text-lg font-mono uppercase tracking-widest">Explore Resources</span>
                                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </div>
                            }
                            icon={<ArrowRight className="h-0 w-0" />}
                        />
                    </Link>
                </BentoGrid>
            </section>

            {/* Live Data Module (Stats) */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-black/40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-0 md:divide-x md:divide-white/5">
                        <div className="text-center px-2 md:px-4">
                            <div className="text-3xl md:text-5xl font-bold font-serif text-white mb-2">
                                <Counter end={56} suffix="+" color="teal" />
                            </div>
                            <p className="text-[10px] md:text-xs font-mono text-teal/60 tracking-[0.2em] uppercase">Events Hosted</p>
                        </div>
                        <div className="text-center px-2 md:px-4">
                            <div className="text-3xl md:text-5xl font-bold font-serif text-white mb-2">
                                <Counter end={200} suffix="+" color="teal" />
                            </div>
                            <p className="text-[10px] md:text-xs font-mono text-teal/60 tracking-[0.2em] uppercase">Active Members</p>
                        </div>
                        <div className="text-center px-2 md:px-4 col-span-2 md:col-span-1">
                            <div className="text-3xl md:text-5xl font-bold font-serif text-white mb-2">
                                <Counter end={7} suffix="" color="teal" />
                            </div>
                            <p className="text-[10px] md:text-xs font-mono text-teal/60 tracking-[0.2em] uppercase">Years Legacy</p>
                        </div>
                    </div>
                </div>
            </section>



            {/* Featured Events - Carousel */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Upcoming Events"
                        subtitle="Curated mathematical experiences"
                        gradient={true}
                    />
                    <EventsGrid items={upcomingEvents} />
                </div>
            </section>

            {/* Gallery - Bento Grid */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle title="Captured Moments" subtitle="Glimpses into our world" />

                    <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
                        {/* Large Item */}
                        <div className="col-span-2 row-span-2 relative aspect-square md:aspect-auto rounded-2xl overflow-hidden group bg-gradient-to-br from-teal/10 to-teal/30">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-9xl opacity-20 group-hover:opacity-40 transition-opacity font-serif">∑</span>
                            </div>
                            <div className="absolute bottom-0 left-0 p-6">
                                <h4 className="text-white text-xl font-bold">Annual Math Fest</h4>
                                <p className="text-white/70 text-sm">2025 Highlights</p>
                            </div>
                        </div>

                        {/* Small Items */}
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="relative aspect-square md:aspect-auto rounded-2xl overflow-hidden bg-card/50 hover:bg-card transition-colors flex items-center justify-center group border border-border">
                                <span className="text-4xl text-muted group-hover:text-foreground transition-colors font-serif opacity-50">
                                    {["π", "∫", "∞", "√"][i - 1]}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <Link href="/gallery" className="btn btn-outline">
                            View Full Gallery
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
