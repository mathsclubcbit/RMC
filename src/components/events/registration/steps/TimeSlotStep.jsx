'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Users, AlertTriangle } from 'lucide-react';

/**
 * TimeSlotStep - Step for selecting a time slot
 * @param {{
 *   timeSlots: Array<{ name: string, date: string, startTime: string, endTime: string, maxTeams: number|string }>,
 *   slotCounts: Record<string, number>,
 *   selectedTimeSlot: string,
 *   onSelect: (slotName: string) => void
 * }} props
 */
function TimeSlotStep({ timeSlots, slotCounts = {}, selectedTimeSlot, onSelect }) {

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [h, m] = timeStr.split(':');
            const hour = parseInt(h, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const h12 = hour % 12 || 12;
            return `${h12}:${m} ${ampm}`;
        } catch {
            return timeStr;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
        >
            <div className="mb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    Select Your Time Slot
                </h3>
                <p className="text-xs text-white/50">
                    Choose an available time slot for your participation.
                </p>
            </div>

            <div className="space-y-3">
                {timeSlots.map((slot, idx) => {
                    const maxTeams = Number(slot.maxTeams) || 0;
                    const registeredCount = slotCounts[slot.name] || 0;
                    const remaining = maxTeams > 0 ? maxTeams - registeredCount : Infinity;
                    const isFull = maxTeams > 0 && remaining <= 0;
                    const isSelected = selectedTimeSlot === slot.name;

                    return (
                        <motion.button
                            key={idx}
                            type="button"
                            disabled={isFull}
                            onClick={() => !isFull && onSelect(slot.name)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden ${isFull
                                    ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                                    : isSelected
                                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20 cursor-pointer'
                                }`}
                        >
                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="absolute top-3 right-3">
                                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                                </div>
                            )}

                            {/* Full badge */}
                            {isFull && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                                    <AlertTriangle className="w-3 h-3 text-red-400" />
                                    <span className="text-[10px] font-bold uppercase text-red-400">Full</span>
                                </div>
                            )}

                            {/* Slot content */}
                            <div className="flex flex-col gap-2">
                                <h4 className={`font-bold text-base tracking-wide ${isSelected ? 'text-cyan-300' : isFull ? 'text-white/30' : 'text-white/90'
                                    }`}>
                                    {slot.name || `Slot ${idx + 1}`}
                                </h4>

                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                    {slot.date && (
                                        <span className={`font-mono ${isSelected ? 'text-cyan-400/80' : 'text-white/50'}`}>
                                            📅 {formatDate(slot.date)}
                                        </span>
                                    )}
                                    {(slot.startTime || slot.endTime) && (
                                        <span className={`font-mono ${isSelected ? 'text-cyan-400/80' : 'text-white/50'}`}>
                                            🕐 {formatTime(slot.startTime)}{slot.endTime ? ` – ${formatTime(slot.endTime)}` : ''}
                                        </span>
                                    )}
                                </div>

                                {/* Capacity indicator */}
                                {maxTeams > 0 && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Users className={`w-3.5 h-3.5 ${isFull ? 'text-red-400/60' : isSelected ? 'text-cyan-400/70' : 'text-white/30'}`} />
                                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-[120px]">
                                            <div
                                                className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500/60' : remaining <= 3 ? 'bg-amber-400/60' : 'bg-cyan-400/50'
                                                    }`}
                                                style={{ width: `${Math.min((registeredCount / maxTeams) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className={`text-[10px] font-mono ${isFull ? 'text-red-400/60' : remaining <= 3 ? 'text-amber-400/80' : isSelected ? 'text-cyan-400/70' : 'text-white/40'
                                            }`}>
                                            {isFull ? '0' : remaining}/{maxTeams} left
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}

export default memo(TimeSlotStep);
