import { createAdminClient } from "@/lib/supabase/server";
import TeamCard from "@/components/TeamCard";
import TeamHero from "@/components/team/TeamHero";

// Force dynamic to ensure we get latest data
export const dynamic = 'force-dynamic';

async function getTeamMembers() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("rmc_council")
        .select("*")
        .order("priority_order", { ascending: true });

    if (error) return [];
    return data || [];
}

export default async function TeamPage() {
    const allMembers = await getTeamMembers();

    // --- Strict Filtering Logic --- //

    // 1. The Visionaries (Faculty)
    const faculty = allMembers.filter(m =>
        ['Faculty Advisor', 'Faculty', 'Patron'].includes(m.category)
    );

    // 2. The High Council (Apex Leadership)
    const president = allMembers.find(m => m.position === 'President');
    const vicePresident = allMembers.find(m => m.position === 'Vice President');
    const generalSecretary = allMembers.find(m => m.position === 'General Secretary');

    // 3. The Core Council (Joint Secretaries & Core Members)
    // Filter for Core Committee/Matrix but EXCLUDE the High Council roles to avoid duplicates
    const coreCouncil = allMembers.filter(m => {
        const isCoreCat = ['Core Committee', 'Core Matrix'].includes(m.category);
        const isHighCouncil = ['President', 'Vice President', 'General Secretary'].includes(m.position);
        return isCoreCat && !isHighCouncil;
    }).sort((a, b) => {
        // Sort: Joint Secretaries first, then by priority_order
        if (a.position === 'Joint Secretary' && b.position !== 'Joint Secretary') return -1;
        if (a.position !== 'Joint Secretary' && b.position === 'Joint Secretary') return 1;
        return (a.priority_order || 99) - (b.priority_order || 99);
    });


    return (
        <div className="min-h-screen bg-[#020617] text-white pt-0 pb-12 overflow-x-hidden selection:bg-teal selection:text-black">

            {/* Cinematic Hero */}
            <TeamHero />

            <div className="relative z-10 max-w-7xl mx-auto px-6 mt-8 md:mt-16 space-y-16">

                {/* --- Section 1: The Visionaries --- */}
                {faculty.length > 0 && (
                    <section className="relative">
                        <SectionHeader title="The Visionaries" subtitle="Guiding Light & Wisdom" />
                        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                            {faculty.map((member, idx) => (
                                <div key={member.id} className="w-full max-w-sm md:w-[350px]">
                                    <TeamCard {...member} index={idx} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}


                {/* --- Section 2: The High Council (Hierarchy) --- */}
                <section className="relative">
                    <SectionHeader title="The High Council" subtitle="Architects of the Infinite" />

                    <div className="flex flex-col items-center gap-8 md:gap-16">

                        {/* Tier 1: The President (Apex) */}
                        {president && (
                            <div className="relative z-10 w-full max-w-md md:w-[450px] transform hover:scale-105 transition-transform duration-700">
                                {/* Golden Halo for President */}
                                <div className="absolute -inset-4 bg-gradient-to-t from-amber-500/20 to-transparent blur-3xl opacity-40 rounded-full pointer-events-none" />
                                <TeamCard {...president} />
                                <div className="mt-6 text-center">
                                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-2" />
                                    <p className="font-[family-name:var(--font-cinzel)] text-amber-500/80 tracking-[0.2em] text-sm uppercase">HEAD OF COUNCIL</p>
                                </div>
                            </div>
                        )}

                        {/* Tier 2: The Pillars (VP & GS) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 w-full max-w-5xl px-4">
                            {vicePresident && (
                                <div className="w-full">
                                    <TeamCard {...vicePresident} />
                                </div>
                            )}
                            {generalSecretary && (
                                <div className="w-full">
                                    <TeamCard {...generalSecretary} />
                                </div>
                            )}
                        </div>

                    </div>
                </section>


                {/* --- Section 3: The Core Matrix --- */}
                {coreCouncil.length > 0 && (
                    <section className="relative">
                        <SectionHeader title="The Core Matrix" subtitle="The Foundation of Logic" />

                        {/* Joint Secretaries & Core Members Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                            {coreCouncil.map((member, idx) => (
                                <TeamCard key={member.id} {...member} index={idx} />
                            ))}
                        </div>
                    </section>
                )}

            </div>

            {/* Footer Message */}
            <div className="text-center mt-20 pb-8">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-teal/20 to-transparent mx-auto mb-6" />
                <p className="text-white/30 font-mono text-xs tracking-widest uppercase">
                    © 2026 Ramanujan Maths Club
                </p>
            </div>
        </div>
    );
}

// Helper Component for Section Headers
function SectionHeader({ title, subtitle }) {
    return (
        <div className="flex flex-col items-center mb-8 relative perspective-[1000px]">
            {/* Glowing Line */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal/20 to-transparent" />

            <div className="relative bg-[#020617]/80 px-10 py-3 border border-teal/10 rounded-full backdrop-blur-xl z-10 shadow-[0_0_30px_-10px_rgba(45,212,191,0.1)]">
                <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 font-[family-name:var(--font-cinzel)] tracking-widest text-center">
                    {title}
                </h2>
            </div>

            <p className="mt-4 text-[10px] md:text-sm font-mono text-teal/60 uppercase tracking-[0.3em] bg-[#020617] px-4 relative z-10">
                {subtitle}
            </p>
        </div>
    );
}
