"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SpotlightHero from "@/components/home/SpotlightHero";
import CinematicIntro from "@/components/home/CinematicIntro";
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
    const [introComplete, setIntroComplete] = useState(false);
    const [introSkipped, setIntroSkipped] = useState(false);

    return (
        <div className="relative overflow-x-hidden min-h-screen">
            <LenisScroll />
            <CinematicIntro onComplete={(skipped) => {
                setIntroComplete(true);
                if (skipped) setIntroSkipped(true);
            }} />

            <MathBackground />
            <div className="fixed inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-background/10 to-background/80" />

            {/* Hero Section - The Event Horizon */}
            <SpotlightHero startAnimation={introComplete} skipped={introSkipped} />

            {/* Philosophy Grid (Bento) */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto mb-16">
                    <SectionTitle
                        title="The Legacy of Infinity"
                        subtitle="Inspired by Srinivasa Ramanujan, we foster a community where mathematics transcends calculations to become art."
                        center={true}
                        variant="silver"
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
                            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-teal/5 to-transparent relative overflow-hidden transition-all duration-500 group-hover:bg-teal/10">
                                {/* Intense Glow Overlay */}
                                <div className="absolute inset-0 bg-teal/20 blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700" />

                                {/* Decorative Golden Spiral Approximation */}
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 border border-teal/20 rounded-full opacity-50 group-hover:border-teal/50 group-hover:scale-110 transition-all duration-700" />
                                <div className="absolute -right-2 -bottom-2 w-28 h-28 border border-white/10 rounded-full opacity-50 group-hover:border-teal/30 transition-colors duration-700" />
                                <div className="absolute right-10 bottom-10 w-16 h-16 border border-teal/30 rounded-full opacity-50" />
                                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.05] group-hover:opacity-1 transition-opacity"></div>
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
                            <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-black/40 border border-white/5 items-center justify-center relative overflow-hidden group-hover:bg-teal/5 transition-colors duration-500">
                                {/* Subtle Grid Background */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                                <div className="absolute inset-0 bg-teal/5 blur-2xl group-hover:bg-teal/10 transition-colors duration-500" />
                                <span className="relative text-8xl font-serif text-white/20 group-hover:text-teal/50 group-hover:scale-110 transition-all duration-500 select-none translate-y-2 drop-shadow-2xl" style={{ transform: "translateZ(50px)" }}>∑</span>
                            </div>
                        }
                        icon={null}
                    />

                    {/* Item 3: Integral (Growth) */}
                    <BentoGridItem
                        className="md:col-span-1 group"
                        title="Growth (∫)"
                        description="Continuous accumulation of knowledge and skills over time."
                        header={
                            <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-black/40 border border-white/5 items-center justify-center relative overflow-hidden group-hover:bg-lime/5 transition-colors duration-500">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                                <div className="absolute inset-0 bg-lime/5 blur-2xl group-hover:bg-lime/10 transition-colors duration-500" />
                                <span className="relative text-8xl font-serif text-white/20 group-hover:text-lime/50 group-hover:scale-110 transition-all duration-500 select-none translate-y-1 drop-shadow-2xl" style={{ transform: "translateZ(50px)" }}>∫</span>
                            </div>
                        }
                        icon={null}
                    />

                    {/* Item 4: The Archive (Resources) - Nav Link */}
                    <Link href="/resources" className="md:col-span-2">
                        <BentoGridItem
                            className="h-full cursor-pointer group hover:border-teal/50 transition-colors"
                            title={<span className="text-xl group-hover:text-teal transition-colors">The Archive (Ω)</span>}
                            description="Unlock a treasure trove of theorems, paradoxes, and puzzles. Dive into our digital library."
                            header={
                                <div className="h-full min-h-[8rem] w-full rounded-xl bg-gradient-to-r from-teal/5 via-blue-900/10 to-purple-900/10 flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:bg-teal/10 group-hover:shadow-[0_0_30px_-5px_rgba(45,155,148,0.2)]">
                                    {/* Pi Digits Background */}
                                    <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-1 opacity-20 select-none overflow-hidden text-[9px] font-mono leading-none text-teal break-all p-4">
                                        {"3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564856692346034861045432664821339360726024914127372458700660631558817488152092096282925409171536436789259036001133053054882046652138414695194151160943305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912"}
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                                    <div className="flex items-center gap-3 text-white/50 group-hover:text-white transition-colors duration-300 relative z-10 scale-125">
                                        <span className="text-lg font-mono uppercase tracking-widest">Access Library</span>
                                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
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
            <HomeEventsSection />

            {/* Gallery - Visual Proof */}
            <ParallaxGallery />
        </div>
    );
}
