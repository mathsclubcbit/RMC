"use client";

import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import PageHeader from "@/components/ui/PageHeader";
import SectionDivider from "@/components/ui/SectionDivider";
import Link from "next/link";
import { Linkedin, Mail, Users, PenTool, Code, Award, ChevronRight } from "lucide-react";

export default function TeamPage() {

    const facultyAdvisors = [
        {
            name: "Dr. K. Ramesh",
            designation: "Faculty Coordinator",
            department: "Mathematics Dept.",
            initials: "KR",
            color: "teal"
        },
        {
            name: "Prof. S. Lakshmi",
            designation: "Faculty Advisor",
            department: "Mathematics Dept.",
            initials: "SL",
            color: "lime"
        },
    ];

    const coreTeam = [
        {
            name: "Aditya Sharma",
            role: "President",
            branch: "CSE, 4th Year",
            quote: "Math is the poetry of logical ideas.",
            initials: "AS",
            color: "teal"
        },
        {
            name: "Priya Reddy",
            role: "Vice President",
            branch: "ECE, 3rd Year",
            quote: "In mathematics, you don't understand things. You just get used to them.",
            initials: "PR",
            color: "lime"
        },
        {
            name: "Rahul Verma",
            role: "Technical Lead",
            branch: "IT, 3rd Year",
            quote: "The essence of mathematics is not to make simple things complicated.",
            initials: "RV",
            color: "orange"
        },
        {
            name: "Sneha Patil",
            role: "Event Coordinator",
            branch: "CSE, 3rd Year",
            quote: "Mathematics is the music of reason.",
            initials: "SP",
            color: "coral"
        },
        {
            name: "Karthik Menon",
            role: "Content Head",
            branch: "MECH, 3rd Year",
            quote: "Pure mathematics is the world's best game.",
            initials: "KM",
            color: "teal"
        },
        {
            name: "Ananya Iyer",
            role: "Design Lead",
            branch: "CSE, 2nd Year",
            quote: "Math reveals the hidden patterns of the world.",
            initials: "AI",
            color: "lime"
        },
        {
            name: "Vikram Singh",
            role: "Social Media Manager",
            branch: "EEE, 2nd Year",
            quote: "Numbers have an important story to tell.",
            initials: "VS",
            color: "orange"
        },
        {
            name: "Meera Das",
            role: "Outreach Coordinator",
            branch: "CIVIL, 3rd Year",
            quote: "Math is the language in which God has written the universe.",
            initials: "MD",
            color: "coral"
        },
    ];

    const departments = [
        { name: "Events Division", members: 12, color: "teal", icon: Users },
        { name: "Technical Division", members: 8, color: "lime", icon: Code },
        { name: "Design Division", members: 6, color: "coral", icon: PenTool },
        { name: "Content Division", members: 5, color: "orange", icon: Award },
    ];

    return (
        <div className="relative min-h-screen">

            <PageHeader
                title="THE COUNCIL"
                subtitle="The architects of order from chaos. The minds governing the Ramanujan Math Club."
            />

            {/* Faculty Advisors */}
            <section className="py-10 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionDivider type="axiom" text="Distinguished Fellows" />

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-16">
                        {facultyAdvisors.map((faculty, index) => (
                            <SpotlightCard key={index} className="bg-black/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] flex items-center gap-6 group hover:border-teal/30 transition-colors">
                                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-${faculty.color}/20 to-transparent border border-${faculty.color}/30 flex items-center justify-center text-3xl font-[family-name:var(--font-cinzel)] text-${faculty.color} shadow-[0_0_30px_-10px_rgba(45,212,191,0.3)] shrink-0`}>
                                    {faculty.initials}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-[family-name:var(--font-cinzel)] font-bold text-white mb-1 group-hover:text-teal transition-colors">
                                        {faculty.name}
                                    </h3>
                                    <p className={`text-${faculty.color} font-mono text-xs uppercase tracking-widest mb-1`}>{faculty.designation}</p>
                                    <p className="text-white/40 font-serif italic text-sm">{faculty.department}</p>
                                </div>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Team */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionDivider type="theorem" number="IV" text="The Core Matrix" />

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                        {coreTeam.map((member, index) => (
                            <SpotlightCard
                                key={index}
                                className={`bg-black/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl flex flex-col h-full group hover:bg-white/5 transition-all duration-300 hover:-translate-y-1`}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-xl bg-${member.color}/10 flex items-center justify-center text-lg font-bold font-serif text-${member.color} border border-${member.color}/20 min-w-[3.5rem]`}>
                                        {member.initials}
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="text-white/20 hover:text-white transition-colors">
                                            <Linkedin className="w-4 h-4" />
                                        </button>
                                        <button className="text-white/20 hover:text-white transition-colors">
                                            <Mail className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-[family-name:var(--font-cinzel)] font-bold text-lg text-white mb-1">{member.name}</h3>
                                <p className={`text-${member.color} text-xs font-mono uppercase tracking-widest mb-4 opacity-80`}>{member.role}</p>

                                <div className="mt-auto pt-4 border-t border-white/5">
                                    <div className="relative pl-3 border-l-2 border-white/10 group-hover:border-teal/50 transition-colors">
                                        <p className="text-xs text-white/50 italic leading-relaxed font-serif">&quot;{member.quote}&quot;</p>
                                    </div>
                                </div>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Departments */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Subsystems"
                        subtitle="Operational Divisions"
                        center={true}
                    />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                        {departments.map((dept, index) => (
                            <div
                                key={index}
                                className={`p-8 rounded-3xl text-center border border-white/5 bg-black/40 hover:border-${dept.color} transition-colors group relative overflow-hidden`}
                            >
                                <div className={`absolute inset-0 bg-${dept.color}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className={`relative w-16 h-16 mx-auto rounded-full bg-${dept.color}/10 flex items-center justify-center mb-4 text-${dept.color} group-hover:scale-110 transition-transform duration-500`}>
                                    <dept.icon className="w-8 h-8" />
                                </div>
                                <div className={`relative text-4xl font-[family-name:var(--font-cinzel)] font-bold text-white mb-2`}>
                                    {dept.members}
                                </div>
                                <h3 className="relative font-serif text-white/80 group-hover:text-white transition-colors">{dept.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Join Team CTA */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-4xl mx-auto text-center relative">
                    <div className="absolute inset-0 bg-teal/10 blur-[100px] rounded-full opacity-20" />

                    <div className="relative border border-white/10 bg-black/50 backdrop-blur-xl rounded-[3rem] p-12 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal to-transparent opacity-50" />

                        <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-cinzel)] font-bold mb-6 text-white">
                            Induction Protocol
                        </h2>
                        <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto font-serif">
                            We are constantly scouting for new variables to add to our equation.
                            If you possess the passion to solve, verify and prove, we require your input.
                        </p>

                        <Link href="/join" className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-teal hover:text-white transition-all duration-300 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)]">
                            <span className="uppercase tracking-widest text-sm">Initiate Sequence</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
