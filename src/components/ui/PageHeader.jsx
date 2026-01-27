"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function PageHeader({ title, subtitle, className = "" }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <div ref={ref} className={`relative min-h-[60vh] flex items-center justify-center overflow-hidden ${className}`}>
            {/* Cinematic Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal/10 via-[#020617] to-[#020617]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

                {/* Parallax Symbol */}
                <motion.div
                    style={{ y, opacity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25vw] font-serif text-white/[0.03] select-none pointer-events-none italic leading-none"
                >
                    &Pi;
                </motion.div>
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Decorative Top Line */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                        className="h-[1px] w-24 bg-gradient-to-r from-transparent via-teal/50 to-transparent mx-auto mb-8"
                    />

                    <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50 uppercase tracking-[0.2em] leading-tight mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        {title}
                    </h1>

                    {subtitle && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="font-sans text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed tracking-wide font-light mix-blend-plus-lighter"
                        >
                            {subtitle}
                        </motion.p>
                    )}

                    {/* Decorative Bottom Line */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
                        className="h-[1px] w-48 bg-gradient-to-r from-transparent via-teal/30 to-transparent mx-auto mt-12"
                    />
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <div className="w-[1px] h-12 bg-gradient-to-b from-teal/50 to-transparent" />
            </motion.div>
        </div>
    );
}
