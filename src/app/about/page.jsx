"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import SectionDivider from "@/components/ui/SectionDivider";
import HeroParticles from "@/components/about/HeroParticles";
import CouncilGrid from "@/components/about/CouncilGrid";
import { Target, Telescope, Users, Award, Brain, BookOpen, Calculator, Sigma, Variable } from "lucide-react";

export default function AboutPage() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef });
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    const objectives = [
        {
            icon: Brain,
            title: "Critical Thinking",
            description: "Developing logical reasoning and structured problem-solving through workshops and puzzles.",
            color: "text-teal",
            bg: "bg-teal/10",
            border: "border-teal/30",
            colSpan: "md:col-span-2"
        },
        {
            icon: Award,
            title: "Competitive Spirit",
            description: "Organizing Olympiads and quizzes to challenge and reward mathematical talent.",
            color: "text-lime",
            bg: "bg-lime/10",
            border: "border-lime/30",
            colSpan: "md:col-span-1"
        },
        {
            icon: BookOpen,
            title: "Expert Discourse",
            description: "Interactive sessions by industry experts on advanced and applied mathematics.",
            color: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/30",
            colSpan: "md:col-span-1"
        },
        {
            icon: Users,
            title: "Vibrant Community",
            description: "Building a supportive network for like-minded math enthusiasts at CBIT.",
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            border: "border-purple-400/30",
            colSpan: "md:col-span-2"
        },
    ];

    const timeline = [
        { year: "2018", event: "RMC established at CBIT" },
        { year: "2019", event: "Inaugural Math Olympiad: 200+ Participants" },
        { year: "2020", event: "Virtual Workshop Series Launched" },
        { year: "2021", event: "Membership crosses 300+ Members" },
        { year: "2022", event: "National Level Partnerships" },
        { year: "2023", event: "Awarded 'Best Technical Club' at CBIT" },
        { year: "2024", event: "Inter-college Mathematics Festival" },
        { year: "2025", event: "Reached 500+ Member Milestone" },
    ];

    const team = [
        { name: "S. Ramanujan", role: "Faculty Advisor", icon: Sigma, color: "text-teal" },
        { name: "John Nash", role: "President", icon: Variable, color: "text-purple-400" },
        { name: "Ada Lovelace", role: "Vice President", icon: Calculator, color: "text-lime" },
        { name: "Alan Turing", role: "Tech Lead", icon: Brain, color: "text-blue-400" },
    ];

    return (
        <div ref={containerRef} className="relative min-h-screen bg-black overflow-hidden selection:bg-teal/20 selection:text-teal">

            {/* Immersive Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <HeroParticles />

                <motion.div
                    style={{ opacity, scale }}
                    className="relative z-10 text-center px-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="inline-block"
                    >
                        <h1 className="text-6xl md:text-9xl font-[family-name:var(--font-cinzel)] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-transparent tracking-tighter mb-4">
                            OUR STORY
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-white/50 font-serif italic text-xl md:text-2xl max-w-2xl mx-auto"
                    >
                        &quot;Empowering minds at CBIT through the beauty of mathematics and the precision of logic.&quot;
                    </motion.p>


                </motion.div>

                {/* Cinematic Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none" />
            </section>

            {/* Theorem I: The Legacy */}
            <section className="relative py-32 px-4 sm:px-6 lg:px-8 z-10">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <SectionDivider type="theorem" number="I" text="Inspired by a Legend" />

                <div className="max-w-7xl mx-auto mt-24">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute -left-10 -top-10 text-[10rem] font-serif text-white/5 font-bold leading-none select-none -z-10">
                                ∞
                            </div>
                            <h3 className="font-[family-name:var(--font-cinzel)] text-4xl md:text-5xl text-white mb-8 leading-tight">
                                The Ramanujan <span className="text-teal">Philosophy</span>
                            </h3>

                            <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-8 font-light font-serif">
                                Srinivasa Ramanujan (1887-1920) was a singularity in the history of mathematics.
                                With almost no formal training, he made extraordinary contributions to number theory,
                                infinite series, and continued fractions. He saw equations not as mere calculations,
                                but as divine revelations.
                            </p>

                            <blockquote className="border-l-2 border-teal pl-6 py-2 italic text-2xl text-white/90 font-serif">
                                &quot;An equation means nothing to me unless it expresses a thought of God.&quot;
                                <footer className="text-xs text-teal mt-4 font-mono tracking-[0.2em] uppercase not-italic">— Srinivasa Ramanujan</footer>
                            </blockquote>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="relative flex justify-center"
                        >
                            <div className="absolute inset-0 bg-teal/20 blur-[100px] rounded-full opacity-30" />
                            <SpotlightCard className="relative aspect-square w-full max-w-sm rounded-[3rem] bg-black/40 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center group cursor-default shadow-2xl">
                                <div className="text-9xl mb-4 font-serif text-transparent bg-clip-text bg-gradient-to-b from-teal to-lime font-bold relative z-10 group-hover:scale-110 transition-transform duration-700">
                                    1729
                                </div>
                                <p className="text-white font-mono text-lg tracking-wide uppercase text-white/50">Taxicab Number</p>
                                <div className="flex items-center gap-4 mt-6 text-sm font-mono text-white/40 border-t border-white/10 pt-4 w-full justify-center">
                                    <span>1³ + 12³</span>
                                    <span className="text-teal">=</span>
                                    <span>9³ + 10³</span>
                                </div>
                            </SpotlightCard>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Axioms: Mission & Vision */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 z-10 relative bg-black/50 overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

                <SectionDivider type="axiom" text="Mission & Vision" />

                <div className="max-w-7xl mx-auto mt-24 relative z-10">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Vision */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <SpotlightCard className="bg-black/80 border border-teal/20 p-12 rounded-[2rem] h-full backdrop-blur-xl hover:bg-teal/5 transition-colors duration-500 group relative overflow-hidden">
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal/10 rounded-full blur-[80px] group-hover:bg-teal/20 transition-colors duration-700" />

                                <div className="flex items-start justify-between mb-10 relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center text-teal border border-teal/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(45,212,191,0.2)]">
                                        <Telescope className="w-8 h-8" />
                                    </div>
                                    <span className="font-mono text-teal/50 text-xs tracking-widest uppercase border border-teal/20 px-3 py-1 rounded-full">Vision</span>
                                </div>
                                <h3 className="text-4xl font-[family-name:var(--font-cinzel)] mb-6 text-white relative z-10">Our Vision</h3>
                                <p className="text-white/60 text-lg leading-relaxed font-serif relative z-10">
                                    To become the premier mathematics community, visualizing a domain where every student appreciates the chaotic beauty of logic.
                                </p>
                            </SpotlightCard>
                        </motion.div>

                        {/* Mission */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <SpotlightCard className="bg-black/80 border border-lime/20 p-12 rounded-[2rem] h-full backdrop-blur-xl hover:bg-lime/5 transition-colors duration-500 group relative overflow-hidden">
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-lime/10 rounded-full blur-[80px] group-hover:bg-lime/20 transition-colors duration-700" />

                                <div className="flex items-start justify-between mb-10 relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-lime/10 flex items-center justify-center text-lime border border-lime/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(132,204,22,0.2)]">
                                        <Target className="w-8 h-8" />
                                    </div>
                                    <span className="font-mono text-lime/50 text-xs tracking-widest uppercase border border-lime/20 px-3 py-1 rounded-full">Mission</span>
                                </div>
                                <h3 className="text-4xl font-[family-name:var(--font-cinzel)] mb-6 text-white relative z-10">Our Mission</h3>
                                <p className="text-white/60 text-lg leading-relaxed font-serif relative z-10">
                                    To extend the curve of knowledge. We provide a coordinate system for learning, exploration, and collaboration, making mathematics accessible to all subsets of students.
                                </p>
                            </SpotlightCard>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Core Variables */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Core Values"
                        subtitle="The foundation of our community"
                        center={true}
                    />
                    <div className="grid md:grid-cols-3 gap-6 mt-16">
                        {objectives.map((obj, index) => (
                            <SpotlightCard
                                key={index}
                                className={`bg-white/5 p-10 rounded-3xl ${obj.colSpan} border-white/5 ${obj.border} transition-all duration-500 backdrop-blur-sm group hover:bg-white/10 hover:-translate-y-2`}
                            >
                                <div className={`w-14 h-14 rounded-2xl ${obj.bg} flex items-center justify-center mb-8 ${obj.color} group-hover:scale-110 transition-transform shadow-lg`}>
                                    <obj.icon className="w-7 h-7" />
                                </div>
                                <h4 className="font-[family-name:var(--font-cinzel)] font-bold text-2xl mb-4 text-white">{obj.title}</h4>
                                <p className="text-white/50 font-serif leading-relaxed text-lg">{obj.description}</p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Council */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 z-10 relative bg-black/40">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Leadership"
                        subtitle="The dedicated minds behind the RMC community."
                        center={true}
                        variant="gold"
                    />
                    <div className="mt-20">
                        <CouncilGrid members={team} />
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-4xl mx-auto">
                    <SectionDivider type="lemma" text="Our Journey" />

                    <div className="relative mt-24">
                        {/* Center Line with Gradient - Hidden on Mobile, replaced by left line */}
                        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-[2px] bg-gradient-to-b from-transparent via-teal/20 to-transparent"></div>
                        <div className="md:hidden absolute left-4 h-full w-[2px] bg-gradient-to-b from-transparent via-teal/20 to-transparent"></div>

                        {timeline.map((item, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                key={index}
                                className={`relative flex items-center mb-24 md:mb-24 ${index % 2 === 0 ? "md:justify-start" : "md:justify-end"} justify-start pl-12 md:pl-0`}
                            >
                                <div className={`w-full md:w-5/12 ${index % 2 === 0 ? "md:text-right md:pr-16" : "md:text-left md:pl-16"} text-left group`}>
                                    <span className="font-mono text-teal text-xl font-bold block mb-3 opacity-50 group-hover:opacity-100 transition-opacity">{item.year}</span>
                                    <h4 className="text-white/80 font-serif text-lg md:text-xl leading-relaxed group-hover:text-white transition-colors">
                                        {item.event}
                                    </h4>
                                </div>

                                {/* Central Node - Adjusted for Mobile Left Alignment */}
                                <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-black border border-teal/50 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(45,212,191,0.2)]">
                                        <div className="w-2 h-2 bg-teal rounded-full" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
