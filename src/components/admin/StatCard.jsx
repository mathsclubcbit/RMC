"use client";

import { motion } from "framer-motion";

// Teal + Gold Duotone Color Scheme
const colorMap = {
    primary: {
        gradient: "from-teal-500/20 via-teal-600/10 to-transparent",
        border: "border-teal-500/30",
        icon: "bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg shadow-teal-500/25",
        glow: "shadow-[0_0_30px_rgba(45,212,191,0.15)]"
    },
    secondary: {
        gradient: "from-teal-400/15 via-teal-500/10 to-transparent",
        border: "border-teal-400/25",
        icon: "bg-gradient-to-br from-teal-300 to-teal-500 text-white shadow-lg shadow-teal-400/20",
        glow: "shadow-[0_0_25px_rgba(45,212,191,0.12)]"
    },
    accent: {
        gradient: "from-amber-500/20 via-amber-600/10 to-transparent",
        border: "border-amber-500/30",
        icon: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]"
    },
    muted: {
        gradient: "from-teal-600/15 via-teal-700/10 to-transparent",
        border: "border-teal-600/25",
        icon: "bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-600/20",
        glow: "shadow-[0_0_25px_rgba(20,184,166,0.12)]"
    },
    // Legacy color mappings for backwards compatibility
    teal: {
        gradient: "from-teal-500/20 via-teal-600/10 to-transparent",
        border: "border-teal-500/30",
        icon: "bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg shadow-teal-500/25",
        glow: "shadow-[0_0_30px_rgba(45,212,191,0.15)]"
    },
    lime: {
        gradient: "from-teal-400/15 via-teal-500/10 to-transparent",
        border: "border-teal-400/25",
        icon: "bg-gradient-to-br from-teal-300 to-teal-500 text-white shadow-lg shadow-teal-400/20",
        glow: "shadow-[0_0_25px_rgba(45,212,191,0.12)]"
    },
    orange: {
        gradient: "from-amber-500/20 via-amber-600/10 to-transparent",
        border: "border-amber-500/30",
        icon: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]"
    },
    purple: {
        gradient: "from-teal-600/15 via-teal-700/10 to-transparent",
        border: "border-teal-600/25",
        icon: "bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-600/20",
        glow: "shadow-[0_0_25px_rgba(20,184,166,0.12)]"
    },
    coral: {
        gradient: "from-amber-500/20 via-amber-600/10 to-transparent",
        border: "border-amber-500/30",
        icon: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]"
    }
};

export default function StatCard({ title, value, icon: Icon, color = "primary", subtitle, trend, index = 0 }) {
    const colors = colorMap[color] || colorMap.primary;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="relative group cursor-default"
        >
            {/* Outer glow effect */}
            <div className={`absolute inset-0 rounded-2xl ${colors.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Main card */}
            <div className={`relative bg-gradient-to-br ${colors.gradient} ${colors.border} border rounded-2xl p-6 backdrop-blur-xl overflow-hidden`}>
                {/* Subtle noise texture */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />

                {/* Decorative gradient orb */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl group-hover:from-white/15 transition-all duration-500" />

                {/* Content */}
                <div className="flex justify-between items-start relative z-10">
                    <div className="flex-1 space-y-2">
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-[0.2em]">{title}</p>
                        <motion.p
                            className="text-4xl font-bold text-white tracking-tight"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                        >
                            {value}
                        </motion.p>
                        {subtitle && (
                            <p className="text-gray-500 text-sm">{subtitle}</p>
                        )}
                        {trend !== undefined && trend !== null && (
                            <motion.div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${trend > 0 ? 'bg-teal-500/20 text-teal-400' : trend < 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                            >
                                <span className="text-sm">{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
                                <span>{Math.abs(trend)}% vs last week</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Icon container */}
                    <motion.div
                        className={`p-3.5 rounded-xl ${colors.icon} transform`}
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Icon className="w-6 h-6" strokeWidth={2} />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
