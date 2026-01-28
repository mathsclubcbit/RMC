"use client";

import { useState, useEffect } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { Linkedin, Mail, ChevronRight, Loader2, User } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.3
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 50, damping: 20 }
    }
};

// Colors for visual flair
const COLORS = ["teal", "lime", "coral", "orange", "blue", "purple"];

export default function TeamPage() {
    const [teamData, setTeamData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            const supabase = createClient();
            // Fetch from 'rmc_council' instead of 'team_members'
            // Sort by priority_order (ascending) first, then created_at
            const { data, error } = await supabase
                .from('rmc_council')
                .select('*')
                .order('priority_order', { ascending: true })
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching team:", error);
                setLoading(false);
                return;
            }

            // Group by category
            const grouped = (data || []).reduce((acc, member) => {
                if (!acc[member.category]) acc[member.category] = [];
                acc[member.category].push(member);
                return acc;
            }, {});

            setTeamData(grouped);
            setLoading(false);
        };

        fetchTeam();
    }, []);

    const renderSection = (title, subtitle, categoryKey, variant = "standard", gridCols = "standard") => {
        const members = teamData[categoryKey];
        if (!members || members.length === 0) return null;

        return (
            <section className="py-24 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle title={title} subtitle={subtitle} center={true} variant={variant === "gold" ? "gold" : "silver"} />

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className={`grid gap-8 mt-16 ${gridCols === "wide" ? "md:grid-cols-2 max-w-5xl mx-auto" :
                            gridCols === "compact" ? "sm:grid-cols-2 lg:grid-cols-4" :
                                "sm:grid-cols-2 lg:grid-cols-3"
                            }`}
                    >
                        {members.map((member, index) => {
                            const color = COLORS[index % COLORS.length];
                            return (
                                <motion.div key={member.id} variants={cardVariants}>
                                    <SpotlightCard
                                        className={`bg-white/[0.03] backdrop-blur-sm border border-white/5 p-6 rounded-2xl flex flex-col h-full group hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-2`}
                                    >
                                        <div className="flex items-start justify-between mb-6">
                                            {/* Image or Initials */}
                                            <div className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-${color}/5 border border-${color}/10 group-hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)] transition-shadow`}>
                                                {member.image_url ? (
                                                    <Image
                                                        src={member.image_url.includes('cloudinary')
                                                            ? member.image_url.replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto,f_auto/')
                                                            : member.image_url}
                                                        alt={member.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center text-xl font-bold font-serif text-${color}`}>
                                                        {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Social Links */}
                                            <div className="flex gap-2">
                                                {member.linkedin_url && (
                                                    <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-blue-600/20 transition-all">
                                                        <Linkedin className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {member.email && (
                                                    <a href={`mailto:${member.email}`} className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-teal/20 transition-all">
                                                        <Mail className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="font-serif font-bold text-xl text-white mb-1 tracking-wide group-hover:text-teal transition-colors">{member.name}</h3>

                                        {/* Position (Skip for Faculty Advisor if null) */}
                                        {member.position && (
                                            <p className={`text-${color} text-xs font-mono uppercase tracking-widest mb-4 opacity-70`}>{member.position}</p>
                                        )}

                                        {/* Caption */}
                                        {member.caption && (
                                            <div className="mt-auto pt-4 border-t border-white/5 relative overflow-hidden">
                                                <p className="text-xs text-white/40 italic leading-relaxed font-serif relative z-10 group-hover:text-white/70 transition-colors line-clamp-3">
                                                    &quot;{member.caption}&quot;
                                                </p>
                                            </div>
                                        )}
                                    </SpotlightCard>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617]">
                <Loader2 className="w-10 h-10 animate-spin text-teal" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#020617] selection:bg-teal/30 selection:text-teal overflow-x-hidden">

            <PageHeader
                title="THE COUNCIL"
                subtitle="The architects of order from chaos. The minds governing the Ramanujan Math Club."
            />

            {/* Sections based on requested categories */}
            {renderSection("Guiding Constants", "Faculty Advisors", "Faculty Advisor", "silver", "wide")}

            {renderSection("The Core Matrix", "IV. Governance Logic", "Core Matrix", "standard", "compact")}

            {/* Technical & Design usually go well together visually if separate or stacked */}
            {renderSection("Technical Division", "System Architects", "Technical", "standard", "standard")}

            {renderSection("Design Team", "Visual Artists", "Design Team", "gold", "standard")}

            {renderSection("Visual Media", "Media Production", "Visual Media", "standard", "standard")}

            {renderSection("Public Relations", "Communication", "PR Team", "standard", "standard")}

            {renderSection("The Team", "Club Members", "Team", "standard", "compact")}

            {/* Join Team CTA */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto text-center relative"
                >
                    <div className="absolute inset-0 bg-teal/10 blur-[120px] rounded-full opacity-30" />

                    <div className="relative border border-white/10 bg-black/40 backdrop-blur-2xl rounded-[3rem] p-16 overflow-hidden group hover:border-teal/30 transition-colors duration-500">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal to-transparent opacity-50" />
                        <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-teal to-transparent opacity-50" />

                        <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 text-white tracking-wide">
                            Induction Protocol
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-sans font-light leading-relaxed">
                            We are constantly scouting for new variables to add to our equation.
                            If you possess the passion to solve, verify and prove, we require your input.
                        </p>

                        <Link href="/join" className="inline-flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full font-bold hover:bg-teal hover:text-white transition-all duration-500 shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(45,212,191,0.6)] group-hover:scale-105">
                            <span className="uppercase tracking-[0.2em] text-sm">Initiate Sequence</span>
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
