import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import Link from "next/link";
import { Target, Telescope, Users, Award, History, Brain, Sparkles, BookOpen } from "lucide-react";

export const metadata = {
    title: "About Us - RMC | Ramanujan Math Club",
    description: "Learn about the history, mission, and vision of the Ramanujan Math Club at CBIT.",
};

const objectives = [
    {
        icon: Brain,
        title: "Promote Critical Thinking",
        description: "Encourage logical reasoning and problem-solving skills among students through challenging puzzles.",
        color: "teal",
        colSpan: "md:col-span-2"
    },
    {
        icon: Award,
        title: "Organize Competitions",
        description: "Host olympiads, quizzes, and puzzle contests to challenge minds.",
        color: "lime",
        colSpan: "md:col-span-1"
    },
    {
        icon: BookOpen,
        title: "Workshops & Lectures",
        description: "Conduct sessions by experts on advanced mathematical concepts.",
        color: "orange",
        colSpan: "md:col-span-1"
    },
    {
        icon: Users,
        title: "Build Community",
        description: "Create a supportive network of math enthusiasts at CBIT.",
        color: "coral",
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

export default function AboutPage() {
    return (
        <div className="relative overflow-hidden">
            {/* Background Textures */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal/10 blur-[100px] rounded-full mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-lime/10 blur-[100px] rounded-full mix-blend-screen"></div>
            </div>

            {/* Hero Banner */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium text-sm font-mono text-teal mb-6">
                        <History className="w-4 h-4" /> Est. 2018
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif tracking-tight">
                        About <span className="text-gradient">RMC</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto font-light leading-relaxed">
                        Where passion for numbers meets the art of problem solving.
                    </p>
                </div>
            </section>

            {/* The Legacy Section (Glass Card) */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="glass-premium rounded-3xl p-8 md:p-12 border border-white/5">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <SectionTitle
                                    title="The Man Who Knew Infinity"
                                    subtitle="A tribute to Srinivasa Ramanujan"
                                    center={false}
                                />
                                <p className="text-muted text-lg leading-relaxed mb-6">
                                    Srinivasa Ramanujan (1887-1920) was one of the greatest mathematical geniuses
                                    of all time. Born in Erode, India, he made extraordinary contributions to
                                    mathematical analysis, number theory, infinite series, and continued fractions.
                                </p>
                                <div className="pl-6 border-l-4 border-teal py-2 my-8">
                                    <p className="font-serif italic text-xl text-foreground">
                                        "An equation means nothing to me unless it expresses a thought of God."
                                    </p>
                                    <p className="text-sm text-teal mt-3 font-mono tracking-wider uppercase">— Srinivasa Ramanujan</p>
                                </div>
                            </div>
                            <div className="relative flex justify-center">
                                <SpotlightCard className="aspect-square w-full max-w-sm rounded-2xl bg-gradient-to-br from-teal/10 to-transparent border border-teal/20 flex flex-col items-center justify-center p-8 text-center group">
                                    <div className="text-8xl md:text-9xl mb-4 font-serif text-transparent bg-clip-text bg-gradient-to-b from-teal to-lime font-bold group-hover:scale-110 transition-transform duration-500">
                                        1729
                                    </div>
                                    <p className="text-foreground font-mono text-lg">The Hardy-Ramanujan Number</p>
                                    <p className="text-sm text-muted mt-2">
                                        1³ + 12³ = 9³ + 10³
                                    </p>
                                </SpotlightCard>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision (Bento Grid) */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle title="Our Purpose" subtitle="Driving Excellence" center={true} />

                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        <SpotlightCard className="bg-black/40 border border-teal/20 p-10 rounded-3xl h-full">
                            <div className="w-16 h-16 rounded-2xl bg-teal/20 flex items-center justify-center mb-6 text-teal">
                                <Target className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 font-serif">Our Mission</h3>
                            <p className="text-muted text-lg leading-relaxed">
                                To ignite passion for mathematics among CBIT students by providing
                                a platform for learning, exploration, and collaboration. We aim to make
                                mathematics accessible, engaging, and fun for everyone.
                            </p>
                        </SpotlightCard>

                        <SpotlightCard className="bg-black/40 border border-lime/20 p-10 rounded-3xl h-full">
                            <div className="w-16 h-16 rounded-2xl bg-lime/20 flex items-center justify-center mb-6 text-lime">
                                <Telescope className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 font-serif">Our Vision</h3>
                            <p className="text-muted text-lg leading-relaxed">
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
                        title="Core Objectives"
                        subtitle="What we strive to achieve"
                        gradient={true}
                    />
                    <div className="grid md:grid-cols-3 gap-6">
                        {objectives.map((obj, index) => (
                            <SpotlightCard
                                key={index}
                                className={`bg-black/20 border border-white/10 p-8 rounded-2xl ${obj.colSpan} hover:border-${obj.color}/50 transition-colors`}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-${obj.color}/10 flex items-center justify-center mb-4 text-${obj.color}`}>
                                    <obj.icon className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-xl mb-3 font-serif">{obj.title}</h4>
                                <p className="text-muted">{obj.description}</p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-4xl mx-auto">
                    <SectionTitle
                        title="Our Journey"
                        subtitle="Milestones in RMC's history"
                    />
                    <div className="relative mt-12">
                        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gradient-to-b from-teal via-lime to-transparent opacity-30"></div>
                        {timeline.map((item, index) => (
                            <div
                                key={index}
                                className={`relative flex items-center mb-12 ${index % 2 === 0 ? "justify-start" : "justify-end"
                                    }`}
                            >
                                <div
                                    className={`w-5/12 ${index % 2 === 0 ? "text-right pr-12" : "text-left pl-12"
                                        }`}
                                >
                                    <div className="glass-premium p-6 rounded-2xl hover:bg-white/5 transition-colors cursor-default border border-white/5 group">
                                        <span className="text-2xl font-bold text-gradient font-serif block mb-2">{item.year}</span>
                                        <p className="text-muted group-hover:text-foreground transition-colors">{item.event}</p>
                                    </div>
                                </div>
                                <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-background border-2 border-${index % 2 === 0 ? 'teal' : 'lime'} z-10 shadow-[0_0_10px_rgba(45,155,148,0.5)]`}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
