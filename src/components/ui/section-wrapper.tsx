"use client";

import { motion, useInView, type HTMLMotionProps } from "framer-motion";
import { useRef } from "react";

import { cn } from "@/lib/utils";

interface SectionWrapperProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
}

export function SectionWrapper({ children, className, ...props }: SectionWrapperProps) {
    const ref = useRef(null);
    useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            // initial={{ opacity: 0, y: 50 }}
            // animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            // transition={{ duration: 0.8, delay, ease: "easeOut" }}
            className={cn("py-16 md:py-24", className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}
