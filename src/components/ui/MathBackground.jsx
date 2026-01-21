"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const equations = [
    "e^{i\\pi} + 1 = 0",
    "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
    "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}",
    "\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\epsilon_0}",
    "F = G \\frac{m_1 m_2}{r^2}",
    "i\\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H} \\Psi",
    "\\mathcal{F}(\\omega) = \\int_{-\\infty}^{\\infty} f(t)e^{-i\\omega t} dt",
    "V - E + F = 2",
    "\\phi = \\frac{1 + \\sqrt{5}}{2}",
    "a^2 + b^2 = c^2"
];

export default function MathBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Floating Equations */}
            {equations.map((eq, i) => (
                <FloatingEquation key={i} equation={eq} index={i} />
            ))}

            {/* Random Symbols */}
            {Array.from({ length: 15 }).map((_, i) => (
                <FloatingSymbol key={`sym-${i}`} index={i} />
            ))}
        </div>
    );
}

function FloatingEquation({ equation, index }) {
    // Random initial positions
    const initialX = Math.random() * 100;
    const initialY = Math.random() * 100;
    const duration = 20 + Math.random() * 20; // Slow float

    return (
        <motion.div
            initial={{ opacity: 0, x: `${initialX}vw`, y: `${initialY}vh` }}
            animate={{
                opacity: [0, 0.1, 0.15, 0.1, 0],
                y: [`${initialY}vh`, `${initialY - 20}vh`]
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                ease: "linear",
                delay: index * 2
            }}
            className="absolute text-white/10 text-sm md:text-lg font-serif italic whitespace-nowrap"
            style={{
                filter: "blur(0.5px)",
                transform: `rotate(${Math.random() * 10 - 5}deg)`
            }}
        >
            {/* Note: In a real app we might use KaTeX, but here just raw text looks cryptic/cool enough for background */}
            {equation}
        </motion.div>
    );
}

function FloatingSymbol({ index }) {
    const symbols = ["∑", "∫", "∂", "∇", "∏", "Ω", "λ", "μ", "π", "θ", "∞", "≈", "≠", "≡", "√"];
    const symbol = symbols[index % symbols.length];

    return (
        <motion.div
            initial={{
                opacity: 0,
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: 0.5
            }}
            animate={{
                opacity: [0, 0.2, 0.4, 0.2, 0],
                y: "+=100",
                rotate: [0, 360]
            }}
            transition={{
                duration: 15 + Math.random() * 15,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5
            }}
            className="absolute text-teal/20 text-2xl md:text-4xl font-serif"
        >
            {symbol}
        </motion.div>
    )
}
