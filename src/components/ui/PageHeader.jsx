"use client";

import { motion } from "framer-motion";

export default function PageHeader({ title, subtitle, className = "" }) {
    return (
        <div className={`relative pt-32 pb-16 text-center ${className}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10"
            >
                {/* Optional Est. Tag */}
                {/* Removed default Est. 2018 based on user feedback */}
                {/* <div className="flex items-center justify-center gap-4 mb-4 opacity-70">
                    <div className="h-[1px] w-12 bg-gradient-to-l from-teal/60 to-transparent" />
                    <span className="font-serif italic text-teal text-sm tracking-widest">Est. 2018</span>
                    <div className="h-[1px] w-12 bg-gradient-to-r from-teal/60 to-transparent" />
                </div> */}

                <h1 className="font-[family-name:var(--font-cinzel)] text-4xl md:text-6xl text-white uppercase tracking-widest leading-none mb-6 text-shadow-glow">
                    {title}
                </h1>

                {subtitle && (
                    <p className="font-serif text-xl md:text-2xl text-white/60 italic max-w-2xl mx-auto leading-relaxed px-6">
                        {subtitle}
                    </p>
                )}

                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-[1px] w-32 bg-gradient-to-r from-transparent via-teal/40 to-transparent mx-auto mt-8"
                />
            </motion.div>
        </div>
    );
}
