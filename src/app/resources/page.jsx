"use client";

import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import PageHeader from "@/components/ui/PageHeader";
import SectionDivider from "@/components/ui/SectionDivider";
import { Book, Puzzle, Globe, ExternalLink, Download, Brain, Sparkles, Lightbulb, FileText, FolderOpen } from "lucide-react";

export default function ResourcesPage() {

    const puzzles = [
        {
            title: "The Missing Dollar",
            difficulty: "Easy",
            description: "Three friends pay $30 for a room. The manager gives back $5. Each takes $1, leaving $2. $27 + $2 = $29. Where's the missing dollar?",
            color: "teal",
            icon: Brain
        },
        {
            title: "Bridge Crossing",
            difficulty: "Medium",
            description: "Four people must cross a bridge at night with one torch. Bridge holds max 2 people. Times: 1, 2, 5, 10 min. How to cross in 17 min?",
            color: "lime",
            icon: Puzzle
        },
        {
            title: "Monty Hall Problem",
            difficulty: "Medium",
            description: "3 doors: 1 car, 2 goats. Pick a door. Host reveals a goat. Should you switch? What's the probability?",
            color: "coral",
            icon: Lightbulb
        },
        {
            title: "Prisoners and Hats",
            difficulty: "Hard",
            description: "100 prisoners in line, each with a random black/white hat. Starting from back, each guesses own hat color. Strategy to save 99?",
            color: "orange",
            icon: Sparkles
        },
    ];

    const books = [
        {
            title: "The Man Who Knew Infinity",
            author: "Robert Kanigel",
            description: "The definitive biography of Srinivasa Ramanujan.",
            color: "teal"
        },
        {
            title: "Fermat's Last Theorem",
            author: "Simon Singh",
            description: "The story of a puzzle that defied proof for 350 years.",
            color: "lime"
        },
        {
            title: "How to Solve It",
            author: "George Pólya",
            description: "A new aspect of mathematical method.",
            color: "coral"
        },
        {
            title: "The Art of Problem Solving",
            author: "Sandor Lehoczky",
            description: "Essential for math competition preparation.",
            color: "orange"
        },
        {
            title: "Gödel, Escher, Bach",
            author: "Douglas Hofstadter",
            description: "A metaphorical fugue on minds and machines.",
            color: "teal"
        },
        {
            title: "A Mathematician's Apology",
            author: "G.H. Hardy",
            description: "A classic memoir by Ramanujan's mentor.",
            color: "lime"
        },
    ];

    const websites = [
        { name: "Brilliant.org", url: "https://brilliant.org", description: "Interactive problem solving", color: "teal" },
        { name: "Art of Problem Solving", url: "https://artofproblemsolving.com", description: "Olympiad preparation", color: "lime" },
        { name: "Project Euler", url: "https://projecteuler.net", description: "Computational math problems", color: "coral" },
        { name: "Khan Academy", url: "https://khanacademy.org", description: "Free math courses", color: "orange" },
        { name: "3Blue1Brown", url: "https://3blue1brown.com", description: "Visual math explanations", color: "teal" },
        { name: "Numberphile", url: "https://numberphile.com", description: "Fun math videos", color: "lime" },
    ];

    return (
        <div className="relative min-h-screen">

            <PageHeader
                title="THE ARCHIVE"
                subtitle="Curated knowledge to fuel your mathematical curiosity. Access the database."
            />

            {/* Puzzle of the Week */}
            <section className="py-10 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionDivider type="axiom" text="Conundrums & Paradoxes" />

                    <div className="grid md:grid-cols-2 gap-8 mt-16">
                        {puzzles.map((puzzle, index) => (
                            <SpotlightCard key={index} className={`bg-black/40 border border-white/10 p-8 rounded-3xl h-full flex flex-col hover:border-${puzzle.color}/50 hover:bg-white/5 transition-all group`}>
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-3 rounded-xl bg-${puzzle.color}/10 text-${puzzle.color} group-hover:scale-110 transition-transform`}>
                                        <puzzle.icon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-[10px] font-bold font-mono px-3 py-1 rounded-full border border-${puzzle.color}/30 bg-${puzzle.color}/5 text-${puzzle.color} uppercase tracking-widest`}>
                                        {puzzle.difficulty}
                                    </span>
                                </div>
                                <h3 className="font-[family-name:var(--font-cinzel)] font-bold text-2xl text-white mb-4 group-hover:text-teal transition-colors">{puzzle.title}</h3>
                                <p className="text-white/60 font-serif text-lg leading-relaxed flex-grow mb-6">{puzzle.description}</p>
                                <button className={`w-full py-3 rounded-lg border border-${puzzle.color}/20 text-${puzzle.color} hover:bg-${puzzle.color}/10 transition-colors font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 group/btn`}>
                                    Decrypt Solution <Sparkles className="w-4 h-4 group-hover/btn:animate-spin" />
                                </button>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recommended Books (Digital Library) */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionDivider type="theorem" number="VI" text="Bibliotheca" />

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                        {books.map((book, index) => (
                            <SpotlightCard
                                key={index}
                                className={`group bg-white/5 border border-white/10 p-1 rounded-2xl hover:border-${book.color}/50 transition-colors duration-500`}
                            >
                                <div className={`bg-gradient-to-br from-${book.color}/20 to-black p-8 rounded-xl h-full flex flex-col relative overflow-hidden`}>
                                    {/* Book Spine Effect */}
                                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-white/5 border-r border-white/10 ml-0 shadow-2xl"></div>

                                    <div className="mb-8 ml-6">
                                        <h3 className="font-[family-name:var(--font-cinzel)] font-bold text-xl mb-2 leading-tight text-white group-hover:text-${book.color}-200">{book.title}</h3>
                                        <p className="text-xs text-white/50 font-mono uppercase tracking-widest">Authored by {book.author}</p>
                                    </div>

                                    <div className="mt-auto ml-6 relative z-10">
                                        <p className="text-white/70 text-sm leading-relaxed border-t border-white/10 pt-4 font-serif italic">
                                            &quot;{book.description}&quot;
                                        </p>
                                    </div>

                                    {/* Decorative Icon */}
                                    <Book className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 group-hover:text-white/10 group-hover:-rotate-12 transition-all duration-700" />
                                </div>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Useful Websites */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="External Nodes"
                        subtitle="Remote uplink points"
                        center={true}
                    />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {websites.map((site, index) => (
                            <a
                                key={index}
                                href={site.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block h-full"
                            >
                                <SpotlightCard className={`bg-black/20 border border-white/5 p-6 rounded-2xl h-full group hover:border-${site.color}/50 hover:bg-white/5 transition-all`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <Globe className={`w-8 h-8 text-${site.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                                        <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="font-bold font-serif text-lg mb-2 text-white group-hover:text-teal transition-colors">
                                        {site.name}
                                    </h3>
                                    <p className="text-white/50 text-sm font-mono">{site.description}</p>
                                </SpotlightCard>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Competition Problems */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative mt-12 mb-12">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent">
                        <div className="bg-black/80 backdrop-blur-xl rounded-[2.5rem] p-12 border border-white/5">
                            <h2 className="text-3xl font-[family-name:var(--font-cinzel)] text-white mb-2">Classified Records</h2>
                            <p className="text-white/50 mb-12 font-serif">Access declassified problem sets from previous operations.</p>

                            <div className="grid sm:grid-cols-3 gap-6">
                                {[
                                    { year: "2025", problems: 25, color: "teal" },
                                    { year: "2024", problems: 30, color: "lime" },
                                    { year: "2023", problems: 28, color: "coral" },
                                ].map((archive, index) => (
                                    <div key={index} className="bg-white/5 border border-white/5 p-6 rounded-2xl hover:border-teal/30 transition-all group cursor-pointer hover:bg-white/10">
                                        <FolderOpen className={`w-8 h-8 text-${archive.color} mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity`} />
                                        <div className={`text-2xl font-bold font-mono text-white mb-1`}>
                                            File_{archive.year}
                                        </div>
                                        <p className="text-white/30 text-xs mb-6 uppercase tracking-widest">{archive.problems} Documents</p>
                                        <button className="w-full py-2 bg-white/5 rounded text-xs font-mono text-teal hover:bg-teal hover:text-black transition-colors flex items-center justify-center gap-2">
                                            <Download className="w-3 h-3" /> ACCESS
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
