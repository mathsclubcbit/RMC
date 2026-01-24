"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ChaosHero from "@/components/home/ChaosHero";
import LenisScroll from "@/components/ui/LenisScroll";
import SectionTitle from "@/components/ui/SectionTitle";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import ParallaxGallery from "@/components/home/ParallaxGallery";
import HomeEventsSection from "@/components/home/HomeEventsSection";
import StatsSection from "@/components/home/StatsSection";
import { ArrowRight, Trophy, Calendar, Users, Star, TrendingUp } from "lucide-react";
import MathDerivation from "@/components/ui/MathDerivation";
import MathBackground from "@/components/ui/MathBackground";

export default function Home() {
    return (
        <div className="relative overflow-x-hidden min-h-screen bg-[#020617] selection:bg-teal/30 selection:text-teal">
            <LenisScroll />

            {/* Background Layer - Vector Field */}
            <MathBackground />
            <div className="fixed inset-0 pointer-events-none z-0 bg-[url('/noise.png')] opacity-[0.15] mix-blend-overlay" />

            {/* Hero Section - The Chaos System */}
            <ChaosHero />

            {/* Philosophy Grid (Bento) */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Mathematical Divider: Lemma 1 */}
                <div className="max-w-7xl mx-auto mb-16 flex items-center gap-4 opacity-50">
                    <span className="font-serif italic text-teal text-xl">Lemma 1.</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-teal/50 to-transparent" />
                </div>

                <div className="max-w-7xl mx-auto mb-24">
                    <SectionTitle
                        title="The Logic Lattice"
                        subtitle="A digital framework where mathematical thought structures interconnect to form a perfect proof of community."
                        center={true}
                        variant="silver"
                    />
                </div>

                <BentoGrid>
                    {/* Item 1: The Vision (Large) */}
                    <BentoGridItem
                        className="md:col-span-2 group border-white/10 hover:border-teal/30 transition-colors"
                        title={<span className="font-serif italic text-2xl">Axiom of Purpose</span>}
                        description={
                            <span className="text-sm md:text-base leading-relaxed text-muted-foreground font-serif">
                                We posit that mathematics is not merely calculation, but the language of the universe.
                                Our mission is to explore the <span className="text-teal italic">infinite cardinality</span> of potential within every student.
                            </span>
                        }
                        header={
                            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-black/40 border border-white/5 relative overflow-hidden transition-all duration-500 group-hover:bg-teal/5">
                                {/* Intense Glow Overlay */}
                                <div className="absolute inset-0 bg-teal/10 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700" />

                                {/* Blueprint Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

                                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                    <MathDerivation />
                                </div>
                            </div>
                        }
                        icon={<Star className="h-6 w-6 text-teal/70 group-hover:text-teal transition-colors" />}
                    />

                    {/* Item 2: Sigma (Community) */}
                    <BentoGridItem
                        className="md:col-span-1 group border-white/10 hover:border-teal/30"
                        title={<span className="font-serif italic text-2xl">Summation (∑)</span>}
                        description={<span className="font-serif text-muted-foreground">The integral of diverse minds converging to a single limit.</span>}
                        header={
                            <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-black/40 border border-white/5 items-center justify-center relative overflow-hidden group-hover:bg-teal/5 transition-colors duration-500">
                                <span className="relative text-9xl font-serif text-white/10 group-hover:text-teal/40 transition-all duration-500 select-none italic">∑</span>
                            </div>
                        }
                        icon={null}
                    />

                    {/* Item 3: Integral (Growth) */}
                    <BentoGridItem
                        className="md:col-span-1 group border-white/10 hover:border-teal/30"
                        title={<span className="font-serif italic text-2xl">Evolution (∫)</span>}
                        description={<span className="font-serif text-muted-foreground">Continuous accumulation of knowledge over the domain of time.</span>}
                        header={
                            <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-black/40 border border-white/5 items-center justify-center relative overflow-hidden group-hover:bg-lime/5 transition-colors duration-500">
                                <span className="relative text-9xl font-serif text-white/10 group-hover:text-lime/40 transition-all duration-500 select-none italic">∫</span>
                            </div>
                        }
                        icon={null}
                    />

                    {/* Item 4: The Archive (Resources) - Nav Link */}
                    <Link href="/resources" className="md:col-span-2">
                        <BentoGridItem
                            className="h-full cursor-pointer group border-white/10 hover:border-teal/50 transition-colors"
                            title={<span className="text-2xl font-serif italic group-hover:text-teal transition-colors">The Archive (Ω)</span>}
                            description={<span className="font-serif text-muted-foreground">Unlock the set of all known theorems. Enter the library.</span>}
                            header={
                                <div className="h-full min-h-[8rem] w-full rounded-xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:bg-teal/5">
                                    <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-1 opacity-10 select-none overflow-hidden text-[10px] font-serif leading-none text-teal break-all p-8 tracking-widest">
                                        {"3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564856692346034861045432664821339360726024914127372458700660631558817488152092096282925409171536436789259036001133053054882046652138414695194151160943305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912"}
                                    </div>

                                    <div className="flex items-center gap-3 text-white/50 group-hover:text-white transition-colors duration-300 relative z-10 scale-110">
                                        <span className="text-lg font-serif italic tracking-widest border-b border-transparent group-hover:border-teal/50 transition-all">Examine Proof</span>
                                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            }
                            icon={null}
                        />
                    </Link>
                </BentoGrid>
            </section>

            {/* Live Data Module (Stats) */}
            <StatsSection />

            {/* Featured Events - Carousel */}
            <div className="relative">
                {/* Mathematical Divider: Lemma 2 */}
                <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4 opacity-50 px-6 lg:px-8">
                    <span className="font-serif italic text-teal text-xl">Lemma 2.</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-teal/50 to-transparent" />
                </div>
                <HomeEventsSection />
            </div>

            {/* Gallery - Visual Proof */}
            <div className="relative pb-24">
                {/* Mathematical Divider: Q.E.D */}
                <div className="max-w-7xl mx-auto mb-12 flex items-center gap-4 opacity-50 px-6 lg:px-8 justify-center">
                    <div className="h-[1px] w-24 bg-gradient-to-l from-white/30 to-transparent" />
                    <span className="font-serif italic text-white/50 text-xl tracking-widest">Q.E.D.</span>
                    <div className="h-[1px] w-24 bg-gradient-to-r from-white/30 to-transparent" />
                </div>
                <ParallaxGallery />
            </div>

        </div>
    );
}
