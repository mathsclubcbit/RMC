'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';

/**
 * PosterModal - Premium lightbox for event poster display
 * @param {{ event: object, isOpen: boolean, onClose: () => void }} props
 */
export default function PosterModal({ event, isOpen, onClose }) {
    if (!isOpen || !event) return null;

    return (
        <motion.div
            key="poster-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
        >
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />

            {/* Decorative glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal/10 rounded-full blur-[150px]" />
            </div>

            {/* Content Container */}
            <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative z-10 flex flex-col items-center max-w-4xl w-full"
                onClick={e => e.stopPropagation()}
            >
                {/* Image Container with frame */}
                <div className="relative group">
                    {/* Outer glow ring */}
                    <div className="absolute -inset-1 bg-gradient-to-br from-teal/30 via-transparent to-emerald-500/20 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />

                    {/* Image */}
                    <div className="relative bg-black/50 p-2 rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
                        <Image
                            src={event.posterDesktop || event.img}
                            alt={event.title}
                            width={800}
                            height={1200}
                            className="max-h-[70vh] w-auto object-contain rounded-xl"
                            unoptimized
                        />
                    </div>
                </div>

                {/* Event Title */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-center"
                >
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
                        {event.title}
                    </h3>
                    <p className="text-white/40 text-sm font-mono">
                        {event.date} • {event.registrationFee || "Free"}
                    </p>
                </motion.div>

                {/* Close button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={onClose}
                    className="mt-8 flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-teal/30 transition-all group"
                >
                    <X className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-widest">Close Preview</span>
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
