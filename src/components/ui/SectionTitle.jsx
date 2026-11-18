import { motion } from "framer-motion";

export default function SectionTitle({ title, subtitle, center = true, gradient = false, variant = "default" }) {
    // Determine the text class
    let textClass = "text-foreground";
    let accentColor = "teal";

    if (gradient || variant === "primary") {
        textClass = "text-gradient";
        accentColor = "teal";
    } else if (variant === "gold") {
        textClass = "text-gradient-gold";
        accentColor = "orange";
    } else if (variant === "silver") {
        textClass = "text-gradient-silver";
        accentColor = "white";
    }

    return (
        <div className={`relative mb-16 ${center ? "text-center" : "text-left"}`}>
            {/* 1. Cinematic Background Symbol (faint) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 0.03, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-0"
            >
                <span className="text-[20rem] font-serif italic text-white leading-none">∑</span>
            </motion.div>

            {/* 2. Content Layer */}
            <div className="relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h2 className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 tracking-[0.15em] uppercase pb-2 ${textClass}`}>
                        {title}
                    </h2>

                    {subtitle && (
                        <div className="flex flex-col items-center gap-6">
                            {/* Decorative Separator */}
                            <div className="flex items-center gap-4">
                                <span className={`h-[1px] w-12 bg-gradient-to-r from-transparent to-${accentColor}/30`}></span>
                                <span className={`font-math text-lg tracking-widest text-${accentColor}/40`}>{"\u222B"}</span>
                                <span className={`h-[1px] w-12 bg-gradient-to-l from-transparent to-${accentColor}/30`}></span>
                            </div>

                            <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-2xl mx-auto font-sans font-light tracking-[0.05em] leading-relaxed opacity-80">
                                {subtitle}
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
