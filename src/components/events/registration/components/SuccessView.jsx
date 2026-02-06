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

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2 tracking-wide px-4">
                {event?.successMessage || "You're In!"}
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
                {event?.whatsappLink && (
                    <a
                        href={event.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-4 bg-[#25D366] text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[#128C7E] shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all flex items-center justify-center gap-2 mb-2"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        Join WhatsApp Group
                    </a>
                )}
                <TicketDownloadButton
                    event={event}
                    ticketCode={registrationId}
                    qrCodeUrl={qrCodeUrl}
                />
                <Link
                    href="/events"
                    className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 hover:border-teal/30 transition-all text-center"
                >
                    Back to Events
                </Link>
            </div>
        </motion.div>
    );
}
