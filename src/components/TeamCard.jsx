"use client";

import Image from "next/image";
import { Linkedin, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamCard({ name, position, category, image_url, linkedin_url, email, caption }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.4 }}
            className="group relative flex flex-col items-center"
        >
            {/* Image Container with Glow */}
            <div className="relative w-48 h-48 mb-6">
                <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-2xl group-hover:bg-teal-500/30 transition-all duration-500" />
                <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 group-hover:border-teal-500/50 transition-colors">
                    <Image
                        src={image_url || "/placeholder-user.jpg"}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Social Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                        {linkedin_url && (
                            <a
                                href={linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/10 rounded-full hover:bg-teal-500 hover:text-white transition-colors"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                        )}
                        {email && (
                            <a
                                href={`mailto:${email}`}
                                className="p-2 bg-white/10 rounded-full hover:bg-teal-500 hover:text-white transition-colors"
                            >
                                <Mail className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="text-center">
                <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors">
                    {name}
                </h3>
                <p className="text-sm font-medium text-teal-400/80 mb-2">{position}</p>
                {caption && (
                    <p className="text-xs text-white/40 max-w-[200px] leading-relaxed line-clamp-2">
                        {caption}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
