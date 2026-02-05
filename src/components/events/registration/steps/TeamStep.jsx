'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus, Shield } from 'lucide-react';
import { TeamMemberCard } from '../components';

/**
 * TeamStep - Step 2: Team management
 * @param {{
 *   formData: object,
 *   teamMembers: Array,
 *   teamConstraints: { minTeamSize: number, maxTeamSize: number },
 *   currentTeamSize: number,
 *   amountToPay: number,
 *   hasPricingTierForCurrentTeamSize: boolean,
 *   variablePricingEnabled: boolean,
 *   onAddTeammate: () => void,
 *   onRemoveTeammate: (index: number) => void,
 *   onUpdateTeammate: (index: number, data: object) => void
 * }} props
 */
function TeamStep({
    formData,
    teamMembers,
    teamConstraints,
    currentTeamSize,
    amountToPay,
    hasPricingTierForCurrentTeamSize,
    variablePricingEnabled,
    onAddTeammate,
    onRemoveTeammate,
    onUpdateTeammate
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Team Status Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${hasPricingTierForCurrentTeamSize
                    ? 'bg-teal/5 border-teal/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`bg-black/30 w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-lg border ${hasPricingTierForCurrentTeamSize ? 'text-teal border-teal/30' : 'text-red-400 border-red-500/30'
                        }`}>
                        {currentTeamSize}
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">Team Size</div>
                        <div className="text-white text-xs font-medium">
                            {teamConstraints.minTeamSize === teamConstraints.maxTeamSize
                                ? `Required: ${teamConstraints.minTeamSize}`
                                : `Min: ${teamConstraints.minTeamSize} • Max: ${teamConstraints.maxTeamSize}`
                            }
                        </div>
                    </div>
                </div>

                {/* Dynamic Price Display */}
                {variablePricingEnabled && (
                    <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">Price</div>
                        <div className={`font-mono font-bold ${hasPricingTierForCurrentTeamSize ? 'text-teal' : 'text-red-400'}`}>
                            {hasPricingTierForCurrentTeamSize ? `₹${amountToPay}` : 'N/A'}
                        </div>
                    </div>
                )}
            </div>

            {/* Team Leader Card (Read Only) */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 relative overflow-hidden ring-1 ring-teal/30 shadow-[0_0_20px_rgba(45,212,191,0.1)]">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Shield className="w-12 h-12 rotate-12" />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-emerald-600 flex items-center justify-center text-black font-bold shadow-lg shrink-0">
                        1
                    </div>
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-teal mb-1">Team Leader</div>
                        <div className="text-white font-serif text-lg leading-none mb-1">{formData.name || "Your Name"}</div>
                        <div className="text-white/40 text-xs">{formData.email || "your.email@example.com"}</div>
                    </div>
                </div>
            </div>

            {/* Teammates List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {teamMembers.map((member, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TeamMemberCard
                                member={member}
                                index={idx}
                                onChange={onUpdateTeammate}
                                onRemove={onRemoveTeammate}
                                canRemove={teamMembers.length >= teamConstraints.minTeamSize} // Fix: Logic check
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    type="button"
                    onClick={onAddTeammate}
                    disabled={currentTeamSize >= teamConstraints.maxTeamSize}
                    className="flex-1 py-3 px-4 rounded-xl border border-dashed border-white/20 hover:border-teal/50 hover:bg-teal/5 text-white/60 hover:text-teal transition-all text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <UserPlus className="w-4 h-4" /> Add Teammate
                </button>
                {teamMembers.length > 0 && currentTeamSize > teamConstraints.minTeamSize && (
                    <button
                        type="button"
                        onClick={() => onRemoveTeammate(teamMembers.length - 1)}
                        className="p-3 rounded-xl border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                    >
                        <UserMinus className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

export default memo(TeamStep);
