"use client";

import * as React from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
    spotlight?: boolean;
}

export function GlassCard({
    className,
    hoverEffect = false,
    spotlight = true,
    children,
    ...props
}: GlassCardProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const boundsRef = React.useRef<DOMRect | null>(null);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        if (!spotlight) return;
        if (!boundsRef.current) return;
        const { left, top } = boundsRef.current;
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    function handleMouseEnter({ currentTarget }: React.MouseEvent) {
        if (!spotlight) return;
        boundsRef.current = currentTarget.getBoundingClientRect();
    }

    function handleMouseLeave() {
        boundsRef.current = null;
    }

    return (
        <div
            className={cn(
                "group relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden",
                hoverEffect &&
                    "transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20",
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {spotlight && (
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100 will-change-[opacity]"
                    style={{
                        background: useMotionTemplate`
              radial-gradient(
                650px circle at ${mouseX}px ${mouseY}px,
                rgba(157, 134, 255, 0.15),
                transparent 80%
              )
            `,
                    }}
                />
            )}

            <div className="relative z-10 h-full">{children}</div>
        </div>
    );
}
