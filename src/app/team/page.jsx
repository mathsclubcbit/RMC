import { createAdminClient } from "@/lib/supabase/server";
import TeamCard from "@/components/TeamCard";

// Force dynamic to ensure we get latest data
export const dynamic = 'force-dynamic';

async function getTeamMembers() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("rmc_council")
        .select("*")
        .order("priority_order", { ascending: true }); // Manual override

    if (error) return [];

    // Sort logic: Faculty -> Core -> Others
    // We can also sort properly in JS if needed
    return data || [];
}

export default async function TeamPage() {
    const members = await getTeamMembers();

    // Grouping strategies
    const faculty = members.filter(m => m.category === 'Faculty' || m.category === 'Patron');
    const core = members.filter(m => m.category === 'Core Committee' || m.category === 'Lead');
    const technical = members.filter(m => m.category === 'Technical' || m.category === 'Tech');
    const design = members.filter(m => m.category === 'Design' || m.category === 'Creative');
    const others = members.filter(m => !['Faculty', 'Patron', 'Core Committee', 'Lead', 'Technical', 'Tech', 'Design', 'Creative'].includes(m.category));

    const sections = [
        { title: "Faculty Mentors", items: faculty },
        { title: "The Core Council", items: core },
        { title: "Technical Wizards", items: technical },
        { title: "Creative Minds", items: design },
        { title: "Community Leaders", items: others }
    ].filter(s => s.items.length > 0);

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-20">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <header className="text-center mb-24">
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-6 tracking-tight">
                        The Council
                    </h1>
                    <p className="text-xl text-white/40 max-w-2xl mx-auto">
                        The architects, designers, and visionaries behind the machine.
                    </p>
                </header>

                <div className="space-y-32">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <div className="flex items-center gap-4 mb-16">
                                <h2 className="text-3xl font-bold text-teal-400/80 font-mono uppercase tracking-widest">
                                    {section.title}
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-teal-500/50 to-transparent" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
                                {section.items.map((member) => (
                                    <TeamCard
                                        key={member.id}
                                        {...member}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
