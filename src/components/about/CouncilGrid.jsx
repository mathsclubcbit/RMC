"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";

export default function CouncilGrid({ members }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.map((member, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                    className="group relative h-[350px] overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-teal/50 transition-colors duration-500"
                >
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 z-10" />

                    {/* Member Image (Placeholder or Actual) */}
                    <div className="absolute inset-0 z-0">
                        {member.image ? (
                            <img
                                src={member.image}
                                alt={member.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal/20 via-black to-black opacity-50" />
                                <div className="w-full h-full bg-black/50 flex items-center justify-center text-8xl font-serif text-white/5 font-bold group-hover:scale-110 transition-transform duration-700">
                                    {member.name?.[0] || "?"}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 z-20 flex flex-col justify-end p-6">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <div className={`text-xs font-mono uppercase tracking-widest mb-2 ${member.color} opacity-80`}>
                                {member.role}
                            </div>
                            <h3 className="text-xl font-[family-name:var(--font-cinzel)] text-white font-bold mb-1">
                                {member.name}
                            </h3>
                            <div className="h-[1px] w-12 bg-white/20 my-4 group-hover:w-full transition-all duration-700" />

                            {/* Social Links */}
                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                <button className="text-white/50 hover:text-white transition-colors"><Github className="w-4 h-4" /></button>
                                <button className="text-white/50 hover:text-white transition-colors"><Linkedin className="w-4 h-4" /></button>
                                <button className="text-white/50 hover:text-white transition-colors"><Mail className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
