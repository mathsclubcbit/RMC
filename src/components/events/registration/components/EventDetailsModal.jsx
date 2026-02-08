'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import EventDetailsContent from './EventDetailsContent';

/**
 * @param {{ event: object, isOpen: boolean, onClose: () => void, isHackathonOrIdeathon: boolean, isIdeathon: boolean }} props
 */
export default function EventDetailsModal({ event, isOpen, onClose, isHackathonOrIdeathon = false, isIdeathon = false }) {
    if (!isOpen || !event) return null;

    return (
        <motion.div
            key="details-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl bg-[#0f111a] border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl shadow-black/50"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-serif font-bold text-white">Event Details</h3>
                        <p className="text-white/40 text-xs font-mono mt-1 uppercase tracking-widest">{event.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <EventDetailsContent
                        event={event}
                        isHackathonOrIdeathon={isHackathonOrIdeathon}
                        isIdeathon={isIdeathon}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}
