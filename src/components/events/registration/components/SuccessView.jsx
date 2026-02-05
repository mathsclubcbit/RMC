'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import TicketDownloadButton from '../../TicketDownloadButton';

/**
 * SuccessView - Displayed after successful registration
 * @param {{ 
 *   event: object, 
 *   registrationId: string, 
 *   qrCodeUrl: string 
 * }} props
 */
export default function SuccessView({ event, registrationId, qrCodeUrl }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-center py-10"
        >
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-br from-teal/20 to-emerald-500/10 rounded-full flex items-center justify-center mb-6 ring-2 ring-teal/30 shadow-[0_0_40px_rgba(45,212,191,0.2)]"
            >
                <CheckCircle className="w-12 h-12 text-teal" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2 tracking-wide">
                You&apos;re In!
            </h2>
            <p className="text-white/50 mb-8 max-w-xs mx-auto">
                Registered for <span className="text-teal block mt-1">{event?.title}</span>
            </p>

            <div className="bg-white p-4 rounded-xl mb-4 shadow-2xl">
                {qrCodeUrl && (
                    <Image
                        src={qrCodeUrl}
                        alt="QR"
                        width={180}
                        height={180}
                        className="rounded-lg"
                        unoptimized
                    />
                )}
            </div>
            <p className="text-xs text-white/30 font-mono mb-8 tracking-widest bg-white/5 px-4 py-2 rounded-full">
                TICKET: {registrationId}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <TicketDownloadButton
                    event={event}
                    ticketCode={registrationId}
                    qrCodeUrl={qrCodeUrl}
                />
                <Link
                    href="/events"
                    className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 hover:border-teal/30 transition-all"
                >
                    Back to Events
                </Link>
            </div>
        </motion.div>
    );
}
