'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available or just use template literals

/**
 * TimeSlotStep - Step for selecting a time slot - Noir Edition
 * Simple, high contrast list of options.
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
        <div className="space-y-8">
            <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                    Select Time Slot
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                    Please secure a time slot for your team. Slots are limited.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {timeSlots.map((slot, idx) => {
                    const maxTeams = Number(slot.maxTeams) || 0;
                    const registeredCount = slotCounts[slot.name] || 0;
                    const remaining = maxTeams > 0 ? maxTeams - registeredCount : Infinity;
                    const isFull = maxTeams > 0 && remaining <= 0;
                    const isSelected = selectedTimeSlot === slot.name;

                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={isFull}
                            onClick={() => !isFull && onSelect(slot.name)}
                            className={`
                                relative w-full text-left p-5 border transition-all duration-200 group
                                ${isFull 
                                    ? 'bg-zinc-950 border-white/5 opacity-50 cursor-not-allowed' 
                                    : isSelected 
                                        ? 'bg-white border-white text-black' 
                                        : 'bg-black border-white/10 text-white hover:border-white/30 hover:bg-zinc-900'
                                }
                            `}
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between w-full">
                                    <h4 className={`text-sm font-bold uppercase tracking-wider ${isSelected ? 'text-black' : 'text-zinc-200'}`}>
                                        {slot.name || `Slot ${idx + 1}`}
                                    </h4>
                                    
                                    {/* Selection Indicator */}
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                        ${isSelected ? 'border-black' : 'border-zinc-700 group-hover:border-zinc-500'}`}
                                    >
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                                    {slot.date && (
                                        <span className={`flex items-center gap-2 ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                                            <Calendar className="w-3.5 h-3.5" /> {formatDate(slot.date)}
                                        </span>
                                    )}
                                    {(slot.startTime || slot.endTime) && (
                                        <span className={`flex items-center gap-2 ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                                            <Clock className="w-3.5 h-3.5" /> {formatTime(slot.startTime)}{slot.endTime ? ` – ${formatTime(slot.endTime)}` : ''}
                                        </span>
                                    )}
                                </div>

                                {maxTeams > 0 && (
                                    <div className="space-y-1.5 pt-2 mt-1 border-t border-dashed border-current/10">
                                        <div className="flex items-center justify-between text-[10px] font-mono tracking-wider uppercase">
                                            <span className={isSelected ? 'text-zinc-600' : 'text-zinc-500'}>
                                                Availability
                                            </span>
                                            <span className={isFull ? 'text-red-500' : isSelected ? 'text-zinc-800 font-bold' : 'text-zinc-400'}>
                                                {isFull ? 'Full' : `${remaining} slots left`}
                                            </span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className={`h-1 w-full ${isSelected ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                                            <div
                                                style={{ width: `${Math.min((registeredCount / maxTeams) * 100, 100)}%` }}
                                                className={`h-full ${isFull ? 'bg-red-500' : isSelected ? 'bg-black' : 'bg-zinc-500'}`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(TimeSlotStep);
