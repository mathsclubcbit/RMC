import PageHeader from "@/components/ui/PageHeader";
import SectionDivider from "@/components/ui/SectionDivider";
import SpotlightCard from "@/components/ui/SpotlightCard";
import RecruitmentForm from "@/components/recruitment/RecruitmentForm";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata = {
    title: "Join RMC | Ramanujan Math Club - CBIT",
    description: "Apply to become a member of the Ramanujan Math Club at CBIT. Begin your mathematical journey with us.",
};

async function getRecruitmentConfig() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("settings")
            .select("key, value")
            .in("key", ["recruitment_open", "recruitment_form_schema", "recruitment_academic_year"]);

        if (error) throw error;

        const settings = {};
        for (const row of data ?? []) {
            settings[row.key] = row.value;
        }

        return {
            isOpen: settings["recruitment_open"] === true || settings["recruitment_open"] === "true",
            schema: Array.isArray(settings["recruitment_form_schema"])
                ? settings["recruitment_form_schema"]
                : [],
            academicYear: String(settings["recruitment_academic_year"] ?? "2025-26"),
        };
    } catch (err) {
        console.error("[join/page] Failed to load recruitment config:", err);
        // Fail open — show form if we can't reach settings
        return { isOpen: true, schema: [], academicYear: "2025-26" };
    }
}

const benefits = [
    { icon: "🎯", title: "Priority Access", description: "First vector to workshops and competitions" },
    { icon: "🏆", title: "Competitive Edge", description: "Represent CBIT in inter-college math events" },
    { icon: "📚", title: "Classified Data", description: "Access exclusive study materials and problem sets" },
    { icon: "🤝", title: "The Network", description: "Connect with like-minded math enthusiasts" },
];

export default async function JoinPage() {
    const { isOpen, schema, academicYear } = await getRecruitmentConfig();

    return (
        <div className="relative min-h-screen">
            <PageHeader
                title="INITIATION"
                subtitle={
                    isOpen
                        ? "Recruitment is open. Submit your application to join the collective."
                        : "Recruitment is currently closed. Check back soon."
                }
            />

            {/* Benefits */}
            <section className="py-10 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <SectionDivider type="axiom" text="Member Privileges" />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                        {benefits.map((benefit, index) => (
                            <SpotlightCard
                                key={index}
                                className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center group hover:bg-white/10 transition-colors"
                            >
                                <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">
                                    {benefit.icon}
                                </div>
                                <h3 className="font-[family-name:var(--font-cinzel)] font-bold text-lg text-white mb-2">
                                    {benefit.title}
                                </h3>
                                <p className="text-white/50 text-xs font-mono uppercase tracking-widest">
                                    {benefit.description}
                                </p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent">
                        <div className="bg-[#020617] rounded-[2.4rem] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
                            {/* Top accent line */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal to-transparent opacity-50" />

                            {isOpen ? (
                                /* ── Open: show form ── */
                                <RecruitmentForm schema={schema} academicYear={academicYear} />
                            ) : (
                                /* ── Closed: friendly lock state ── */
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mx-auto mb-8">
                                        <Lock className="w-8 h-8 text-white/30" />
                                    </div>
                                    <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/30 mb-3">
                                        Recruitment Season
                                    </p>
                                    <h2 className="font-serif text-3xl text-white mb-4">
                                        Closed for Now
                                    </h2>
                                    <p className="text-white/40 font-sans text-sm leading-relaxed max-w-sm mx-auto mb-8">
                                        Recruitment applications are currently closed. Follow us on social media
                                        or subscribe to our newsletter to be notified when the next cycle opens.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Link
                                            href="/join/status"
                                            className="px-6 py-3 border border-teal/30 text-teal text-xs font-mono uppercase tracking-widest
                                                       rounded-lg hover:bg-teal/10 transition-all"
                                        >
                                            Check Application Status →
                                        </Link>
                                        <Link
                                            href="/"
                                            className="px-6 py-3 border border-white/10 text-white/40 text-xs font-mono uppercase tracking-widest
                                                       rounded-lg hover:bg-white/5 transition-all"
                                        >
                                            Return Home
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
