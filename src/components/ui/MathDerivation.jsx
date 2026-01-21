"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export default function MathDerivation({ className }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const pathLength = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <div
            ref={ref}
            className={cn("absolute inset-0 pointer-events-none overflow-hidden select-none z-0", className)}
        >
            <div className="absolute top-[20%] right-[10%] w-[300px] md:w-[500px] h-[200px] opacity-10 rotate-12">
                <svg viewBox="0 0 400 100" className="w-full h-full">
                    {/* Euler's Identity: e^(i*pi) + 1 = 0 */}
                    {/* Simplified path representation for "e" */}
                    <motion.path
                        d="M50 60 C30 60 30 90 50 90 C70 90 70 75 50 75 H35"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        style={{ pathLength, opacity }}
                        className="text-teal"
                    />
                    {/* "i" */}
                    <motion.path
                        d="M90 60 V90 M90 45 V50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        style={{ pathLength, opacity }}
                        className="text-teal"
                    />
                    {/* "pi" */}
                    <motion.path
                        d="M120 60 H160 M130 60 V90 M150 60 V90 C150 90 160 90 160 85"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        style={{ pathLength, opacity }}
                        className="text-teal"
                    />
                    {/* "+" */}
                    <motion.path
                        d="M190 75 H210 M200 65 V85"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        style={{ pathLength, opacity }}
                        className="text-white"
                    />
                    {/* "1" */}
                    <motion.path
                        d="M240 60 V90"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        style={{ pathLength, opacity }}
                        className="text-white"
                    />
                    {/* "=" */}
                    <motion.path
                        d="M270 70 H290 M270 80 H290"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        style={{ pathLength, opacity }}
                        className="text-white"
                    />
                    {/* "0" */}
                    <motion.path
                        d="M330 75 A15 25 0 1 0 330 75.1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        style={{ pathLength, opacity }}
                        className="text-red-500"
                    />
                </svg>
            </div>
        </div>
    );
}
