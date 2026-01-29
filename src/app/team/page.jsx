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
    const members = await getTeamMembers();

    // Role Priority Helper
    const rolePriority = {
        "President": 1,
        "Vice President": 2,
        "General Secretary": 3,
        "Joint Secretary": 4,
        "Head": 1,
        "Member": 2
    };

    const sortByRole = (a, b) => {
        const pA = rolePriority[a.position] || 99;
        const pB = rolePriority[b.position] || 99;
        return pA - pB;
    };

    // Strict Hierarchy Filtering (with Backward Compatibility)
    const faculty = members.filter(m => ['Faculty Advisor', 'Faculty', 'Patron'].includes(m.category));
    const core = members.filter(m => ['Core Committee', 'Core Matrix', 'Lead', 'President', 'Vice President'].includes(m.category)).sort(sortByRole);
    const pr = members.filter(m => ['PR', 'PR Team', 'Public Relations'].includes(m.category)).sort(sortByRole);
    const event = members.filter(m => ['Event', 'Events', 'Event Management'].includes(m.category)).sort(sortByRole);
    const content = members.filter(m => ['Content', 'Content Writing'].includes(m.category)).sort(sortByRole);
    const design = members.filter(m => ['Design', 'Design Team', 'Visual Media', 'Creative'].includes(m.category)).sort(sortByRole);

    // Technical is intentionally hidden for now

    const sections = [
        {
            id: "mentors",
            title: "The Visionaries",
            subtitle: "Guiding Light & Wisdom",
            items: faculty,
            cols: "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto" // Centered layout for faculty
        },
        {
            id: "core",
            title: "The Core Council",
            subtitle: "Orchestrating the Infinite",
            items: core,
            cols: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        },
        {
            id: "pr",
            title: "Public Relations",
            subtitle: "The Voice of RMC",
            items: pr,
            cols: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        },
        {
            id: "events",
            title: "Events Directorate",
            subtitle: "Architects of Experience",
            items: event,
            cols: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        },
        {
            id: "content",
            title: "Content Strategy",
            subtitle: "Weaving Mathematical Narratives",
            items: content,
            cols: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        },
        {
            id: "design",
            title: "Design & Visuals",
            subtitle: "Crafting the Aesthetic",
            items: design,
            cols: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        }
    ].filter(s => s.items.length > 0);

    return (
        <div className="min-h-screen bg-[#020617] text-white pt-0 pb-20 overflow-x-hidden selection:bg-teal selection:text-black">

            {/* Cinematic Hero */}
            <TeamHero />

            <div className="relative z-10 max-w-7xl mx-auto px-6 mt-16 md:mt-0">

                <div className="space-y-40">
                    {sections.map((section) => (
                        <section key={section.id} className="relative">
                            {/* Section Header */}
                            <div className="flex flex-col items-center mb-16 relative">
                                <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal/20 to-transparent" />
                                <div className="relative bg-[#020617] px-8 py-2 border border-teal/10 rounded-full backdrop-blur-xl z-10">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-cormorant)] tracking-wider text-center">
                                        {section.title}
                                    </h2>
                                </div>
                                <p className="mt-4 text-sm font-mono text-teal/60 uppercase tracking-widest bg-[#020617] px-4 relative z-10">
                                    {section.subtitle}
                                </p>
                            </div>

                            {/* Grid */}
                            <div className={`grid ${section.cols} gap-3 md:gap-8 gap-y-8 md:gap-y-16`}>
                                {section.items.map((member, idx) => (
                                    <TeamCard
                                        key={member.id}
                                        {...member}
                                        index={idx} // Pass index if needed for staggering
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Footer Message */}
                <div className="text-center mt-32 pb-10">
                    <p className="text-white/20 font-mono text-xs">
                        © 2026 Ramanujan Maths Club
                    </p>
                </div>
            </div>
        </div>
    );
}
