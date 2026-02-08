"use client";

import Image from "next/image";
import { Sparkles, Infinity as InfinityIcon, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const HubStatic = ({ initialData }) => {
    const { categories = [] } = initialData || {};

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-teal-500/30 font-sans relative overflow-x-hidden">
            {/* --- Static Background --- */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Noise static overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03] z-[1] mix-blend-overlay"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
                />

                {/* Static Gradient Globs */}
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-teal-900/10 rounded-full blur-[120px]" />

                {/* Subtle Radial Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[radial-gradient(circle,rgba(20,184,166,0.03)_0%,transparent_70%)]" />
            </div>

            {/* --- Content Container --- */}
            <div className="relative z-10 max-w-xl mx-auto px-6 py-12 md:py-20">

                {/* Header */}
                <header className="flex flex-col items-center mb-12 relative z-20">
                    <Link href="/" className="group relative mb-8 block">
                        <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/10 hover:border-teal-500/30 transition-colors">
                            {/* Static Rings */}
                            <div className="absolute inset-1 rounded-full border border-white/5" />

                            {/* Pi Symbol */}
                            <span className="text-4xl font-serif text-white group-hover:text-teal-400 transition-colors pb-1 z-10">π</span>
                        </div>
                    </Link>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center gap-3">
                        RMC <span className="text-teal-500 font-serif italic relative">
                            Hub
                            <span className="absolute -bottom-2 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-50" />
                        </span>
                    </h1>
                </header>

                {/* Categories */}
                {categories.length === 0 ? (
                    <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-sm max-w-sm mx-auto">
                        <InfinityIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <h3 className="text-xl font-serif text-white/50 mb-2">Void Detected</h3>
                        <p className="text-white/30 font-mono text-sm">No dimensions found.</p>
                        <Link href="/" className="mt-6 inline-flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-xs tracking-widest uppercase text-teal-400">
                            Return
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {categories.map((category) => (
                            <section key={category.id}>
                                {/* Category Header */}
                                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-6 text-center flex items-center gap-4">
                                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                    {category.name}
                                    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                </h2>

                                {/* Links List */}
                                <div className="flex flex-col space-y-3">
                                    {category.links.map((link) => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-teal-500/30 hover:bg-white/[0.04] transition-colors duration-200 overflow-hidden"
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/20 border border-white/5 flex-shrink-0">
                                                {link.image ? (
                                                    <Image
                                                        src={link.image}
                                                        alt={link.name}
                                                        fill
                                                        className="object-cover transition-opacity duration-300"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Sparkles className="w-4 h-4 text-white/20 group-hover:text-teal-400 transition-colors" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Text Content */}
                                            <div className="flex-1 min-w-0 z-10">
                                                <h3 className="text-base font-medium text-white/90 group-hover:text-white transition-colors truncate">
                                                    {link.name}
                                                </h3>
                                            </div>

                                            {/* Arrow Icon */}
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-teal-400 group-hover:bg-teal-400/10 transition-colors z-10">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-40 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-white/20 text-xs font-mono tracking-widest uppercase">
                        © {new Date().getFullYear()} RMC / Hub
                    </p>
                    <Link href="/" className="text-white/20 hover:text-teal-400 text-xs font-mono tracking-widest uppercase transition-colors">
                        Back to Mainframe
                    </Link>
                </footer>
            </div>
        </div>
    );
};

export default HubStatic;
