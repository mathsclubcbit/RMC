import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import Link from "next/link";
import { Book, Puzzle, Globe, FileText, Video, ExternalLink, Download, Brain, Sparkles, Lightbulb } from "lucide-react";

export const metadata = {
    title: "Resources - RMC | Ramanujan Math Club",
    description: "Access mathematical puzzles, recommended books, and learning resources from RMC.",
};

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

export default function ResourcesPage() {
    return (
        <div className="relative overflow-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-teal/5 blur-[100px] rounded-full mix-blend-screen"></div>
                <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-lime/5 blur-[100px] rounded-full mix-blend-screen"></div>
            </div>

            {/* Hero */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif tracking-tight">
                        <span className="text-gradient">Resources</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto font-light leading-relaxed">
                        Curated knowledge to fuel your mathematical curiosity.
                    </p>
                </div>
            </section>

            {/* Puzzle of the Week */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Math Puzzles"
                        subtitle="Test your problem-solving skills"
                        gradient={true}
                    />
                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        {puzzles.map((puzzle, index) => (
                            <SpotlightCard key={index} className={`bg-black/40 border border-white/10 p-8 rounded-3xl h-full flex flex-col hover:border-${puzzle.color}/50`}>
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-3 rounded-xl bg-${puzzle.color}/10 text-${puzzle.color}`}>
                                        <puzzle.icon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full border border-${puzzle.color}/30 bg-${puzzle.color}/10 text-${puzzle.color} uppercase tracking-wider`}>
                                        {puzzle.difficulty}
                                    </span>
                                </div>
                                <h3 className="font-bold text-2xl font-serif mb-4 group-hover:text-gradient transition-all">{puzzle.title}</h3>
                                <p className="text-muted text-lg leading-relaxed flex-grow mb-6">{puzzle.description}</p>
                                <button className={`w-full py-3 rounded-xl border border-${puzzle.color}/30 text-${puzzle.color} hover:bg-${puzzle.color}/10 transition-colors font-medium text-sm flex items-center justify-center gap-2`}>
                                    View Solution <Sparkles className="w-4 h-4" />
                                </button>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recommended Books (Digital Library) */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Digital Library"
                        subtitle="Essential reading for math enthusiasts"
                    />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                        {books.map((book, index) => (
                            <SpotlightCard
                                key={index}
                                className={`group bg-white/5 border border-white/10 p-1 rounded-2xl hover:border-${book.color}/50 transition-colors duration-500`}
                            >
                                <div className={`bg-gradient-to-br from-${book.color}/20 to-black p-8 rounded-xl h-full flex flex-col relative overflow-hidden`}>
                                    {/* Book Spine Effect */}
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/10 ml-1"></div>

                                    <div className="mb-8 ml-4">
                                        <h3 className="font-bold text-2xl font-serif mb-2 leading-tight text-white">{book.title}</h3>
                                        <p className="text-sm text-white/60 font-mono">by {book.author}</p>
                                    </div>

                                    <div className="mt-auto ml-4 relative z-10">
                                        <p className="text-white/80 text-sm leading-relaxed border-t border-white/10 pt-4">
                                            {book.description}
                                        </p>
                                    </div>

                                    {/* Decorative Icon */}
                                    <Book className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5 group-hover:text-white/10 group-hover:rotate-12 transition-all duration-500" />
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
                        title="Web Resources"
                        subtitle="Curated links for learning"
                    />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {websites.map((site, index) => (
                            <a
                                key={index}
                                href={site.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <SpotlightCard className={`bg-black/20 border border-white/5 p-6 rounded-2xl h-full group hover:border-${site.color}/50`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <Globe className={`w-8 h-8 text-${site.color}`} />
                                        <ExternalLink className="w-4 h-4 text-muted group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 group-hover:text-white transition-colors">
                                        {site.name}
                                    </h3>
                                    <p className="text-muted text-sm">{site.description}</p>
                                </SpotlightCard>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Competition Problems */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative glass-premium mt-12 mb-12 border-y border-white/5">
                <div className="max-w-5xl mx-auto text-center">
                    <SectionTitle
                        title="Archive"
                        subtitle="Past problems from RMC competitions"
                        center={true}
                    />
                    <div className="grid sm:grid-cols-3 gap-8 mt-12">
                        {[
                            { year: "2025", problems: 25, color: "teal" },
                            { year: "2024", problems: 30, color: "lime" },
                            { year: "2023", problems: 28, color: "coral" },
                        ].map((archive, index) => (
                            <SpotlightCard key={index} className="bg-black/40 border border-white/10 p-8 rounded-2xl text-center hover:bg-white/5 transition-colors group">
                                <div className={`text-5xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-b from-${archive.color} to-transparent mb-2`}>
                                    {archive.year}
                                </div>
                                <p className="text-muted font-mono text-sm mb-6">{archive.problems} Problems</p>
                                <button className="btn btn-outline text-xs w-full group-hover:bg-white group-hover:text-black transition-all">
                                    <Download className="w-4 h-4 mr-2" /> Download PDF
                                </button>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
