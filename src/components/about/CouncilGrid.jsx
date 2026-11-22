"use client";

import { Linkedin, Mail } from "lucide-react";

export default function CouncilGrid({ members }) {
    console.log("[CouncilGrid] Rendering", members?.length, "members");

    if (!members || members.length === 0) {
        return <p className="text-white/50 text-center">No members to display</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member, index) => (
                <div
                    key={index}
                    className="relative overflow-hidden rounded-xl bg-white/10 border border-white/20 h-[300px]"
                >
                    {/* Member Image */}
                    {member.image && (
                        <img
                            src={member.image}
                            alt={member.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                        <div className="text-xs font-mono uppercase tracking-widest mb-1 text-teal">
                            {member.role}
                        </div>
                        <h3 className="text-lg text-white font-bold">
                            {member.name}
                        </h3>

                        {/* Social Links */}
                        <div className="flex items-center gap-3 mt-2">
                            {member.linkedin && (
                                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            )}
                            {member.email && (
                                <a href={`mailto:${member.email}`} className="text-white/70 hover:text-white">
                                    <Mail className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
