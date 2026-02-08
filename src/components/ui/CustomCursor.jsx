"use client";

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CustomCursor() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const cursorScale = useMotionValue(1);

    // Restore ORIGINAL spring physics (user preferred this "weight")
    const springConfig = { damping: 25, stiffness: 300, mass: 0.1 };
    const x = useSpring(cursorX, springConfig);
    const y = useSpring(cursorY, springConfig);

    // Scale spring - slightly lower stiffness for a "softer" expansion
    const scale = useSpring(cursorScale, { damping: 15, stiffness: 150, mass: 0.1 });

    useEffect(() => {
        // Don't run on touch devices or mobile
        if ('ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches) {
            return;
        }

        const moveCursor = (e) => {
            cursorX.set(e.clientX - 16);
            cursorY.set(e.clientY - 16);
        };

        const handleMouseOver = (e) => {
            const target = e.target;
            const interactive = target.closest('a, button, input, textarea, [data-cursor="pointer"]');
            cursorScale.set(interactive ? 2.5 : 1);
        };

        const handleMouseDown = () => cursorScale.set(0.8);
        const handleMouseUp = () => cursorScale.set(1);

        window.addEventListener('mousemove', moveCursor, { passive: true });
        window.addEventListener('mouseover', handleMouseOver, { passive: true });
        window.addEventListener('mousedown', handleMouseDown, { passive: true });
        window.addEventListener('mouseup', handleMouseUp, { passive: true });

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [cursorX, cursorY, cursorScale]);

    return (
        <motion.div
            className={cn(
                "fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[100] mix-blend-difference hidden md:block border-2 border-white",
                "shadow-[0_0_15px_rgba(255,255,255,0.3)]" // Added subtle glow to make it "more appreciable"
            )}
            style={{
                x,
                y,
                scale,
            }}
        >
            {/* Center dot - Now with a tiny bit more presence */}
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
        </motion.div>
    );
}

