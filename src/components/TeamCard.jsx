"use client";

import Image from "next/image";
import { Linkedin, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamCard({ name, position, category, image_url, linkedin_url, email, caption }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="group relative w-full"
        >
            {/* Aspect Ratio Container */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white/5 border border-white/10 group-hover:border-teal/50 transition-colors duration-500">
                {/* Image - Grayscale to Color */}
                <Image
                    src={image_url || "/placeholder-user.jpg"}
                    alt={name}
                    fill
                    className="object-cover grayscale-0 md:grayscale md:group-hover:grayscale-0 transition-all duration-700 ease-in-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Quote / Caption Overlay - DESKTOP ONLY (Hover) */}
                {caption && (
                    <div className="hidden md:flex absolute inset-0 p-6 items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 text-center">
                        <div className="relative">
                            <span className="absolute -top-4 -left-2 text-4xl text-teal/20 font-serif">&quot;</span>
                            <p className="text-sm font-medium text-white/90 italic font-serif leading-relaxed">
                                {caption}
                            </p>
                            <span className="absolute -bottom-6 -right-2 text-4xl text-teal/20 font-serif">&quot;</span>
                        </div>
                    </div>
                )}

                {/* Social Actions - Always visible Mobile, Hover Desktop */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-0 opacity-100 md:translate-x-12 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 transition-all duration-500 delay-100">
                    {linkedin_url && (
                        <a
                            href={linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-lg border border-white/10 hover:bg-teal hover:border-teal text-white hover:text-black transition-all"
                        >
                            <Linkedin className="w-4 h-4" />
                        </a>
                    )}
                    {email && (
                        <a
                            href={`mailto:${email}`}
                            className="w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-lg border border-white/10 hover:bg-teal hover:border-teal text-white hover:text-black transition-all"
                        >
                            <Mail className="w-4 h-4" />
                        </a>
                    )}
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-0 inset-x-0 p-2 md:p-5 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-500">
                    {/* Decorative Line - Hidden on Mobile, Hover on Desktop */}
                    <div className="w-0 md:group-hover:w-full h-0.5 bg-teal mb-3 transition-all duration-700 ease-out" />

                    <h3 className="text-xs md:text-xl font-bold text-white font-[family-name:var(--font-cinzel)] tracking-wide group-hover:text-teal transition-colors truncate">
                        {name}
                    </h3>
                    <p className="text-[9px] md:text-xs font-mono uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors mt-0.5 md:mt-1 truncate">
                        {position || category}
                    </p>

                    {/* Quote - MOBILE ONLY (Static below text) */}
                    {caption && (
                        <p className="md:hidden mt-1.5 text-[9px] text-white/60 italic font-serif leading-relaxed border-l-[1.5px] border-teal/30 pl-2 line-clamp-2">
                            &quot;{caption}&quot;
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
