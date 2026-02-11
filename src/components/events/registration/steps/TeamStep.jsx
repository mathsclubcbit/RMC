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
            className="space-y-8"
        >
            {/* Status Bar */}
            <div className={`
                p-4 border-l-2
                ${hasPricingTierForCurrentTeamSize
                    ? 'border-zinc-100 bg-zinc-900/50'
                    : 'border-red-500 bg-red-500/5'
                }
            `}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">
                                Current Size
                            </div>
                            <div className={`text-2xl font-mono
                                ${hasPricingTierForCurrentTeamSize ? 'text-white' : 'text-red-500'}
                            `}>
                                {currentTeamSize.toString().padStart(2, '0')}
                            </div>
                        </div>

                        <div className="h-8 w-px bg-zinc-800" />

                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">
                                Required
                            </div>
                            <div className="text-sm text-zinc-300 font-mono">
                                {teamConstraints.minTeamSize === teamConstraints.maxTeamSize
                                    ? teamConstraints.minTeamSize
                                    : `${teamConstraints.minTeamSize}-${teamConstraints.maxTeamSize}`
                                }
                            </div>
                        </div>
                    </div>

                    {variablePricingEnabled && (
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">
                                Fee
                            </div>
                            <div className={`font-mono text-lg
                                ${hasPricingTierForCurrentTeamSize ? 'text-white' : 'text-zinc-600'}
                            `}>
                                {hasPricingTierForCurrentTeamSize ? `₹${amountToPay}` : '---'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Team Leader */}
            <div className="group relative bg-zinc-900/30 border border-zinc-800 p-6 transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 mb-2">
                             <div className="w-1.5 h-1.5 bg-zinc-100" />
                             <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Team Leader</span>
                        </div>
                        <div className="text-xl text-white font-medium">
                            {formData.name || "Unknown"}
                        </div>
                        <div className="text-sm text-zinc-500 font-mono">
                            {formData.email}
                        </div>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 text-zinc-400">
                         <Shield className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Teammates List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {teamMembers.map((member, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        >
                            <TeamMemberCard
                                member={member}
                                index={idx}
                                onChange={onUpdateTeammate}
                                onRemove={onRemoveTeammate}
                                canRemove={teamMembers.length >= teamConstraints.minTeamSize}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={onAddTeammate}
                    disabled={currentTeamSize >= teamConstraints.maxTeamSize}
                    className="flex-1 py-4 px-6 bg-white text-black text-sm font-medium tracking-wide hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors uppercase flex items-center justify-center gap-2"
                >
                    <UserPlus className="w-4 h-4" /> Add Member
                </button>
                {teamMembers.length > 0 && currentTeamSize > teamConstraints.minTeamSize && (
                    <button
                        type="button"
                        onClick={() => onRemoveTeammate(teamMembers.length - 1)}
                        className="py-4 px-6 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900/30 transition-colors"
                    >
                        <UserMinus className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

export default memo(TeamStep);
