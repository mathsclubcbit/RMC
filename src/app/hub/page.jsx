import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { ExternalLink } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getHubData() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "hub")
        .single();

    if (error || !data) {
        return { categories: [] };
    }

    return data.value || { categories: [] };
}

export default async function HubPage() {
    const hubData = await getHubData();
    const { categories } = hubData;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f] text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.12),transparent_55%)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-teal-500/5 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
                {/* Header */}
                <header className="text-center mb-12">
                    <Link href="/" className="inline-block mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <span className="text-4xl font-serif text-teal-400">π</span>
                        </div>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        RMC <span className="text-teal-400">Hub</span>
                    </h1>
                    <p className="text-white/50 text-sm">Quick links to all our events & resources</p>
                </header>

                {/* Categories & Links */}
                {categories.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-white/40">No links available yet.</p>
                        <Link href="/" className="mt-4 inline-block text-teal-400 hover:underline">
                            ← Back to Home
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {categories.map((category) => (
                            <section key={category.id}>
                                {/* Category Title */}
                                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-3">
                                    <span className="w-8 h-px bg-gradient-to-r from-transparent to-white/20" />
                                    {category.name}
                                    <span className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                                </h2>

                                {/* Links */}
                                <div className="space-y-3">
                                    {category.links.map((link, index) => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-400/30 hover:bg-white/[0.06] transition-all duration-300"
                                            style={{
                                                animationDelay: `${index * 50}ms`,
                                            }}
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/5">
                                                {link.image ? (
                                                    <Image
                                                        src={link.image}
                                                        alt={link.name}
                                                        width={80}
                                                        height={80}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-teal-400/50">
                                                        <ExternalLink className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg group-hover:text-teal-400 transition-colors truncate">
                                                    {link.name}
                                                </h3>
                                            </div>

                                            {/* Arrow */}
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal-400/10 transition-colors">
                                                <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-teal-400 transition-colors" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-16 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition"
                    >
                        ← Back to RMC Website
                    </Link>
                    <p className="mt-4 text-xs text-white/20">
                        © {new Date().getFullYear()} Ramanujan Maths Club, CBIT
                    </p>
                </footer>
            </div>
        </div>
    );
}
