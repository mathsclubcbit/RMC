'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * PremiumInput - Standardized input component for Registration
 * Noir Edition
 */
function PremiumInput({
    label,
    error,
    variant = 'default',
    as = 'input',
    containerClassName = 'w-full',
    className = '',
    ...props
}) {
    const Component = as;

    const baseStyles = "w-full outline-none transition-all duration-300 placeholder-zinc-700 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        default: "bg-black border border-white/20 px-5 py-4 text-white focus:border-white focus:ring-1 focus:ring-white/10 hover:border-white/40 transition-all rounded-none",
        minimal: "bg-transparent border-b border-zinc-800 py-3 text-white focus:border-white px-0 hover:border-zinc-600 transition-all font-sans text-sm",
        centered: "bg-black border border-white/20 px-5 py-4 text-white text-center tracking-[0.2em] text-lg font-bold focus:border-white font-mono rounded-none"
    };

    return (
        <div className={`space-y-2 ${containerClassName}`}>
            {label && (
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-white/40 rounded-full" />
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 group-hover:text-white transition-colors">
                        {label}
                    </label>
                </div>
            )}
            <div className="relative group/input">
                <Component
                    className={cn(baseStyles, variants[variant] || variants.default, error && "border-red-900/80 text-red-200", className)}
                    {...props}
                />
                
                {/* Noir Style Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/0 group-hover/input:border-white/50 transition-all pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/0 group-hover/input:border-white/50 transition-all pointer-events-none" />
                
                {/* Error Message */}
                {error && (
                   <p className="absolute right-0 -bottom-5 text-[9px] text-red-400 font-mono tracking-wider uppercase border-l border-red-500 pl-2">
                       ERR: {error}
                   </p>
                )}
            </div>
        </div>
    );
}

export default memo(PremiumInput);
