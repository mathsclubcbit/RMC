"use client";

import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import MathBackground from "@/components/ui/MathBackground";
import { motion } from "framer-motion";
import { Target, Telescope, Users, Award, History, Brain, BookOpen, Calculator, Sigma, Variable, ChevronRight } from "lucide-react";

export default function AboutPage() {
    const objectives = [
        {
            icon: Brain,
            title: "Promote Critical Thinking",
            description: "Encourage logical reasoning and problem-solving skills among students through challenging puzzles.",
            color: "text-teal",
            bg: "bg-teal/10",
            border: "border-teal/30 md:border-white/10 md:hover:border-teal/50",
            colSpan: "md:col-span-2"
        },
        {
            icon: Award,
            title: "Organize Competitions",
            description: "Host olympiads, quizzes, and puzzle contests to challenge minds.",
            color: "text-lime",
            bg: "bg-lime/10",
            border: "border-lime/30 md:border-white/10 md:hover:border-lime/50",
            colSpan: "md:col-span-1"
        },
        {
            icon: BookOpen,
            title: "Workshops & Lectures",
            description: "Conduct sessions by experts on advanced mathematical concepts.",
            color: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/30 md:border-white/10 md:hover:border-orange-400/50",
            colSpan: "md:col-span-1"
        },
        {
            icon: Users,
            title: "Build Community",
            description: "Create a supportive network of math enthusiasts at CBIT.",
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            border: "border-purple-400/30 md:border-white/10 md:hover:border-purple-400/50",
            colSpan: "md:col-span-2"
        },
    ];

    const timeline = [
        { year: "2018", event: "RMC was founded at CBIT" },
        { year: "2019", event: "First Math Olympiad conducted with 200+ participants" },
        { year: "2020", event: "Launched virtual workshops during pandemic" },
        { year: "2021", event: "Crossed 300+ active members" },
        { year: "2022", event: "Partnered with national math organizations" },
        { year: "2023", event: "Awarded Best Technical Club at CBIT" },
        { year: "2024", event: "Hosted inter-college mathematics fest" },
        { year: "2025", event: "Reached 500+ members milestone" },
    ];

    const team = [
        { name: "S. Ramanujan", role: "Faculty Advisor", icon: Sigma, color: "text-teal" },
        { name: "John Nash", role: "President", icon: Variable, color: "text-purple-400" },
        { name: "Ada Lovelace", role: "Vice President", icon: Calculator, color: "text-lime" },
        { name: "Alan Turing", role: "Tech Lead", icon: Brain, color: "text-blue-400" },
    ];

    return (
        <div className="relative overflow-hidden min-h-screen bg-black text-white selection:bg-teal/30 selection:text-teal font-sans">
            <MathBackground />

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal/5 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[5000ms]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-lime/5 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            {/* Hero Banner */}
            <section className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center justify-center min-h-[60vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-teal mb-8 backdrop-blur-md">
                        <History className="w-3 h-3" />
                        <span className="tracking-widest uppercase">Est. 2018</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-bold mb-8 font-serif tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50">
                        The Enigma <br /> of <span className="text-teal">RMC</span>
                    </h1>
                    <p className="text-lg md:text-2xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed mb-10">
                        Where the elegance of equations meets the thrill of the unknown.
                    </p>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-10"
                >
                    <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
                        <div className="w-1 h-3 bg-teal rounded-full" />
                    </div>
                </motion.div>
            </section>

            {/* The Legacy Section (Glass Card) */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="relative bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-16 border border-white/5 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
                            <div>
                                <SectionTitle
                                    title="The Man Who Knew Infinity"
                                    subtitle="A tribute to Srinivasa Ramanujan"
                                    center={false}
                                />
                                <p className="text-white/60 text-lg leading-relaxed mb-8 font-light">
                                    Srinivasa Ramanujan (1887-1920) was one of the greatest mathematical geniuses
                                    of all time. Born in Erode, India, he made extraordinary contributions to
                                    mathematical analysis, number theory, infinite series, and continued fractions.
                                </p>
                                <div className="pl-6 border-l-2 border-teal py-2 my-8 md:pr-12">
                                    <p className="font-serif italic text-2xl text-white">
                                        "An equation means nothing to me unless it expresses a thought of God."
                                    </p>
                                    <p className="text-xs text-teal mt-4 font-mono tracking-[0.2em] uppercase">— Srinivasa Ramanujan</p>
                                </div>
                            </div>
                            <div className="relative flex justify-center">
                                {/* Mobile: Scale 95 on active. Desktop: Scale 105 on hover */}
                                <SpotlightCard className="aspect-square w-full max-w-sm rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex flex-col items-center justify-center p-8 text-center group cursor-default shadow-[0_0_50px_-20px_rgba(45,212,191,0.2)] active:scale-95 md:active:scale-100 transition-transform">
                                    <div className="relative">
                                        {/* Mobile: Opacity 40 default. Desktop: Opacity 0 -> 50 on hover */}
                                        <div className="absolute inset-0 bg-teal/20 blur-3xl rounded-full opacity-40 md:opacity-0 md:group-hover:opacity-50 transition-opacity duration-500" />
                                        <div className="text-8xl md:text-9xl mb-4 font-serif text-transparent bg-clip-text bg-gradient-to-b from-teal to-lime font-bold md:group-hover:scale-105 transition-transform duration-500 relative z-10">
                                            1729
                                        </div>
                                    </div>
                                    <p className="text-white font-mono text-lg tracking-wide">Hardy-Ramanujan Number</p>
                                    <div className="flex items-center gap-4 mt-4 text-xs font-mono text-white/30">
                                        <span>1³ + 12³</span>
                                        <span className="text-teal">=</span>
                                        <span>9³ + 10³</span>
                                    </div>
                                </SpotlightCard>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Council (Team) */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle title="The Architects" subtitle="Minds behind the club" center={true} />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                        {team.map((member, idx) => (
                            <SpotlightCard key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl group text-center active:bg-white/10 md:hover:bg-white/10 transition-colors active:scale-95 md:active:scale-100 md:hover:scale-100 duration-200">
                                <div className={`w-20 h-20 mx-auto rounded-2xl ${member.color.replace('text', 'bg')}/10 flex items-center justify-center mb-6 border border-white/5 md:group-hover:scale-110 transition-transform`}>
                                    <member.icon className={`w-8 h-8 ${member.color}`} />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-white mb-1 md:group-hover:text-teal transition-colors">{member.name}</h3>
                                <p className="text-xs font-mono text-white/40 uppercase tracking-widest">{member.role}</p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>


            {/* Mission & Vision (Bento Grid) */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle title="The Equation" subtitle="Our purpose & vision" center={true} />

                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        <SpotlightCard className="bg-gradient-to-b from-black/60 to-black/20 border border-teal/20 p-10 rounded-3xl h-full backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center mb-8 text-teal border border-teal/20">
                                <Target className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 font-serif text-white">Our Mission</h3>
                            <p className="text-white/60 text-lg leading-relaxed font-light">
                                To ignite passion for mathematics among students by providing
                                a platform for learning, exploration, and collaboration. We aim to make
                                mathematics accessible, engaging, and fun for everyone.
                            </p>
                        </SpotlightCard>

                        <SpotlightCard className="bg-gradient-to-b from-black/60 to-black/20 border border-lime/20 p-10 rounded-3xl h-full backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-lime/10 flex items-center justify-center mb-8 text-lime border border-lime/20">
                                <Telescope className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 font-serif text-white">Our Vision</h3>
                            <p className="text-white/60 text-lg leading-relaxed font-light">
                                To become the premier mathematics community in the region, envisioning a campus
                                where mathematical curiosity thrives and every student appreciates the beauty of numbers.
                            </p>
                        </SpotlightCard>
                    </div>
                </div>
            </section>


            {/* Objectives (Bento Grid) */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Core Variables"
                        subtitle="What we strive to achieve"
                        gradient={true}
                    />
                    <div className="grid md:grid-cols-3 gap-6 mt-12">
                        {objectives.map((obj, index) => (
                            <SpotlightCard
                                key={index}
                                className={`bg-black/40 p-8 rounded-2xl ${obj.colSpan} border-white/5 ${obj.border} transition-colors bg-clip-padding backdrop-filter backdrop-blur-sm`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${obj.bg} flex items-center justify-center mb-6 ${obj.color}`}>
                                    <obj.icon className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-xl mb-3 font-serif text-white">{obj.title}</h4>
                                <p className="text-white/50">{obj.description}</p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-4xl mx-auto">
                    <SectionTitle
                        title="Timeline of Infinity"
                        subtitle="Our journey through time"
                    />
                    <div className="relative mt-20">
                        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-teal to-transparent opacity-50"></div>
                        {timeline.map((item, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                key={index}
                                className={`relative flex items-center mb-16 ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                            >
                                <div className={`w-5/12 ${index % 2 === 0 ? "text-right pr-8 md:pr-12" : "text-left pl-8 md:pl-12"}`}>
                                    <h4 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal to-lime font-serif mb-2">{item.year}</h4>
                                    <p className="text-white/60 font-light text-sm md:text-base leading-relaxed">{item.event}</p>
                                </div>
                                <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-black border-2 ${index === timeline.length - 1 ? "border-lime shadow-[0_0_15px_rgba(132,204,22,0.5)] animate-pulse" : "border-teal"} z-10`}></div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-20 px-4 text-center z-10 relative">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-4xl font-serif font-bold text-white mb-6">Ready to solve the puzzle?</h2>
                    <p className="text-white/50 mb-8">Join the community where every problem has a solution.</p>
                    <button className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-teal hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)]">
                        Join the Equation
                    </button>
                </div>
            </section>
        </div>
    );
}
