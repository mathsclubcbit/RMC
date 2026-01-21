import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import Link from "next/link";
import { Linkedin, Mail, Github, Award, Users, PenTool, Code } from "lucide-react";

export const metadata = {
    title: "Our Team - RMC | Ramanujan Math Club",
    description: "Meet the faculty advisors and student leaders of the Ramanujan Math Club at CBIT.",
};

const facultyAdvisors = [
    {
        name: "Dr. K. Ramesh",
        designation: "Faculty Coordinator",
        department: "Mathematics Department",
        initials: "KR",
        color: "teal"
    },
    {
        name: "Prof. S. Lakshmi",
        designation: "Faculty Advisor",
        department: "Mathematics Department",
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
    { name: "Events Team", members: 12, color: "teal", icon: Users },
    { name: "Technical Team", members: 8, color: "lime", icon: Code },
    { name: "Design Team", members: 6, color: "coral", icon: PenTool },
    { name: "Content Team", members: 5, color: "orange", icon: Award },
];

import MathBackground from "@/components/ui/MathBackground";

export default function TeamPage() {
    return (
        <div className="relative overflow-hidden min-h-screen">
            {/* Standard Math Background */}
            <MathBackground />

            {/* Hero */}
            <section className="relative pt-32 pb-10 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-4xl mx-auto">
                    <SectionTitle
                        title={<>Our <span className="text-gradient">Team</span></>}
                        subtitle="The brilliant minds driving the Ramanujan Math Club."
                        center={true}
                    />
                </div>
            </section>

            {/* Faculty Advisors */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Faculty Advisors"
                        subtitle="Guiding us with their wisdom and experience"
                        gradient={true}
                    />
                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mt-12">
                        {facultyAdvisors.map((faculty, index) => (
                            <SpotlightCard key={index} className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-8 rounded-3xl text-center flex flex-col items-center">
                                <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-${faculty.color}/20 to-transparent border border-${faculty.color}/30 flex items-center justify-center text-4xl font-serif font-bold text-${faculty.color} mb-6 shadow-xl`}>
                                    {faculty.initials}
                                </div>
                                <h3 className="text-2xl font-bold font-serif mb-1">{faculty.name}</h3>
                                <p className={`text-${faculty.color} font-mono text-sm uppercase tracking-wider mb-2`}>{faculty.designation}</p>
                                <p className="text-muted">{faculty.department}</p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Team */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <SectionTitle
                        title="Core Committee 2025-26"
                        subtitle="Student leaders driving RMC forward"
                    />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                        {coreTeam.map((member, index) => (
                            <SpotlightCard
                                key={index}
                                className={`bg-black/20 border border-white/5 p-6 rounded-2xl flex flex-col h-full group hover:border-${member.color}/30`}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-16 h-16 rounded-2xl bg-${member.color}/10 flex items-center justify-center text-xl font-bold font-serif text-${member.color}`}>
                                        {member.initials}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted hover:text-white">
                                            <Linkedin className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted hover:text-white">
                                            <Mail className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-xl font-serif mb-1 group-hover:text-gradient transition-all">{member.name}</h3>
                                <p className={`text-${member.color} text-sm font-medium mb-4`}>{member.role}</p>

                                <div className="mt-auto">
                                    <p className="text-xs text-muted/60 font-mono mb-4">{member.branch}</p>
                                    <div className="relative pl-3 border-l-2 border-white/10">
                                        <p className="text-sm text-muted italic leading-relaxed">"{member.quote}"</p>
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
                        title="Our Departments"
                        subtitle="Specialized teams working together"
                        center={true}
                    />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                        {departments.map((dept, index) => (
                            <div
                                key={index}
                                className={`glass-premium p-8 rounded-3xl text-center border-t border-white/10 hover:border-${dept.color} transition-colors group`}
                            >
                                <div className={`w-16 h-16 mx-auto rounded-full bg-${dept.color}/10 flex items-center justify-center mb-4 text-${dept.color} group-hover:scale-110 transition-transform`}>
                                    <dept.icon className="w-8 h-8" />
                                </div>
                                <div className={`text-4xl font-bold font-serif text-white mb-2`}>
                                    {dept.members}+
                                </div>
                                <h3 className="font-semibold text-muted group-hover:text-white transition-colors">{dept.name}</h3>
                                <p className="text-xs text-muted/50 mt-1 uppercase tracking-widest">Active Members</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Join Team CTA */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="max-w-4xl mx-auto text-center glass-premium rounded-3xl p-12 border border-white/5">
                    <h2 className="text-4xl font-bold mb-6 font-serif">
                        Want to Join Our Team?
                    </h2>
                    <p className="text-muted text-lg mb-8 max-w-2xl mx-auto">
                        We're always looking for passionate individuals to join our core committee.
                        If you love math and want to make an impact, we want you.
                    </p>
                    <Link href="/join" className="btn btn-primary text-lg px-10 py-4 shadow-lg shadow-teal/20">
                        Apply Now
                    </Link>
                </div>
            </section>
        </div>
    );
}
