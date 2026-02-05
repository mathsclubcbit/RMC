'use client';

import { memo } from 'react';

/**
 * PremiumInput - Standardized input component for Registration
 * @param {{
 *   label?: string,
 *   error?: string,
 *   variant?: 'default' | 'minimal' | 'centered',
 *   as?: 'input' | 'textarea',
 *   containerClassName?: string,
 *   className?: string,
 *   ...props
 * }} props
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

    const baseStyles = "w-full outline-none transition-all duration-300 placeholder-white/20 font-sans disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        default: "bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] hover:border-white/20",
        minimal: "bg-transparent border-b border-white/10 py-2 text-white focus:border-teal/50 px-1 hover:border-white/30",
        centered: "bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white text-center tracking-widest text-lg uppercase focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] font-mono"
    };

    return (
        <div className={`space-y-2 ${containerClassName}`}>
            {label && (
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1 block">
                    {label}
                </label>
            )}
            <div className="relative group">
                <Component
                    {...props}
                    className={`${baseStyles} ${variants[variant] || variants.default} ${className} ${error ? '!border-red-500/50 !text-red-200' : ''}`}
                />

                {variant === 'minimal' && (
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-teal/50 scale-x-0 group-hover:scale-x-0 peer-focus:scale-x-100 transition-transform origin-left" />
                )}
            </div>
            {error && (
                <p className="text-xs text-red-400 font-mono ml-1 animate-pulse flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full inline-block" />
                    {error}
                </p>
            )}
        </div>
    );
}

export default memo(PremiumInput);
