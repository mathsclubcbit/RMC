"use client";

import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { Linkedin, Mail, Users, PenTool, Code, Award, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

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
        <div className="relative min-h-screen bg-[#020617] selection:bg-teal/30 selection:text-teal overflow-x-hidden">

            <PageHeader
                title="THE COUNCIL"
                subtitle="The architects of order from chaos. The minds governing the Ramanujan Math Club."
            />

            {/* Faculty Advisors */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-6xl mx-auto">
                    <SectionTitle title="Guiding Constants" subtitle="Faculty Advisors" center={true} variant="silver" />

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-12"
                    >
                        {facultyAdvisors.map((faculty, index) => (
                            <motion.div key={index} variants={cardVariants}>
                                <SpotlightCard className="h-full bg-white/[0.02] backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] flex items-center gap-8 group hover:border-teal/30 transition-colors shadow-2xl shadow-black/50">
                                    <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br from-${faculty.color}/10 to-transparent border border-${faculty.color}/20 flex items-center justify-center text-4xl font-serif text-${faculty.color} shadow-[0_0_40px_-10px_rgba(45,212,191,0.2)] shrink-0 group-hover:scale-105 transition-transform duration-500`}>
                                        {faculty.initials}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-serif font-bold text-white mb-2 group-hover:text-teal transition-colors tracking-wide">
                                            {faculty.name}
                                        </h3>
                                        <div className="flex flex-col gap-1">
                                            <p className={`text-${faculty.color} font-mono text-xs uppercase tracking-[0.2em] opacity-90`}>{faculty.designation}</p>
                                            <p className="text-white/40 font-serif italic text-sm border-t border-white/5 pt-2 mt-1">{faculty.department}</p>
                                        </div>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Core Team */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 z-10 relative bg-black/20">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="max-w-7xl mx-auto">
                    <SectionTitle title="The Core Matrix" subtitle="IV. Governance Logic" center={true} />

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
                    >
                        {coreTeam.map((member, index) => (
                            <motion.div key={index} variants={cardVariants}>
                                <SpotlightCard
                                    className={`bg-white/[0.03] backdrop-blur-sm border border-white/5 p-6 rounded-2xl flex flex-col h-full group hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-2`}
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`w-16 h-16 rounded-xl bg-${member.color}/5 flex items-center justify-center text-xl font-bold font-serif text-${member.color} border border-${member.color}/10 min-w-[4rem] group-hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)] transition-shadow`}>
                                            {member.initials}
                                        </div>
                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-4 group-hover:translate-x-0">
                                            <button className="text-white/40 hover:text-white transition-colors">
                                                <Linkedin className="w-5 h-5" />
                                            </button>
                                            <button className="text-white/40 hover:text-white transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-serif font-bold text-xl text-white mb-2 tracking-wide group-hover:text-teal transition-colors">{member.name}</h3>
                                    <p className={`text-${member.color} text-xs font-mono uppercase tracking-widest mb-6 opacity-70`}>{member.role}</p>

                                    <div className="mt-auto pt-6 border-t border-white/5 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                                        <p className="text-xs text-white/40 italic leading-relaxed font-serif relative z-10 group-hover:text-white/70 transition-colors">
                                            &quot;{member.quote}&quot;
                                        </p>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </section>

            {/* Departments */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 z-10 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Subsystems"
                        subtitle="Operational Divisions"
                        center={true}
                        variant="gold"
                    />
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
                    >
                        {departments.map((dept, index) => (
                            <motion.div
                                key={index}
                                variants={cardVariants}
                                className={`p-8 rounded-[2rem] text-center border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-${dept.color}/50 transition-all duration-500 group relative overflow-hidden`}
                            >
                                <div className={`absolute inset-0 bg-${dept.color}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                <div className={`absolute -inset-1 bg-gradient-to-r from-${dept.color}/20 to-transparent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

                                <div className={`relative w-20 h-20 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-${dept.color} group-hover:scale-110 group-hover:border-${dept.color}/50 group-hover:bg-${dept.color}/10 transition-all duration-500`}>
                                    <dept.icon className="w-8 h-8" />
                                </div>
                                <div className={`relative text-5xl font-serif font-bold text-white mb-3 tracking-tighter`}>
                                    {dept.members}
                                </div>
                                <h3 className="relative font-sans text-sm uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">{dept.name}</h3>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

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
