"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    Download,
    Printer,
    Calendar,
    MapPin,
    Clock,
    User,
    Mail,
    Hash,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Ticket,
    Users
} from "lucide-react";
import MathBackground from "@/components/ui/MathBackground";

export default function TicketPage() {
    const params = useParams();
    const registrationId = params.registrationId;
    const ticketRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ticketData, setTicketData] = useState(null);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const res = await fetch(`/api/ticket/${registrationId}`);
                if (!res.ok) throw new Error("Failed to load ticket");
                const data = await res.json();
                setTicketData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (registrationId) {
            fetchTicket();
        }
    }, [registrationId]);

    const handleDownload = () => {
        if (!ticketData?.qrCode) return;

        const link = document.createElement('a');
        link.href = ticketData.qrCode;
        link.download = `ticket-${registrationId}.png`;
        link.click();
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <MathBackground />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400">Loading your ticket...</p>
                </div>
            </div>
        );
    }

    if (error || !ticketData) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <MathBackground />
                <div className="relative z-10 text-center">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 text-xl mb-2">Ticket Not Found</p>
                    <p className="text-gray-500">{error || "Unable to load ticket data"}</p>
                </div>
            </div>
        );
    }

    const { registration, event, qrCode, isValid } = ticketData;

    return (
        <div className="min-h-screen bg-[#020617] text-white relative py-8 px-4">
            <MathBackground />

            <div className="relative z-10 max-w-md mx-auto">
                {/* Action Buttons */}
                <div className="flex justify-center gap-3 mb-6 print:hidden">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-400 text-sm transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download QR
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                </div>

                {/* Ticket Card */}
                <motion.div
                    ref={ticketRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Ticket className="w-6 h-6" />
                            <span className="text-xs uppercase tracking-[0.3em] font-semibold opacity-90">Event Ticket</span>
                        </div>
                        <h1 className="text-2xl font-bold">
                            {event?.title || registration?.eventName || "Event"}
                        </h1>
                    </div>

                    {/* QR Code Section */}
                    <div className="p-8 flex flex-col items-center">
                        <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                            {qrCode ? (
                                <Image
                                    src={qrCode}
                                    alt="Ticket QR Code"
                                    width={192}
                                    height={192}
                                    className="w-48 h-48"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                                    QR Code
                                </div>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isValid
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            }`}>
                            {isValid ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Confirmed
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4" />
                                    {registration?.status || "Pending"}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Participant Details */}
                    <div className="px-6 pb-2 space-y-3">
                        <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {registration?.teamMembers && JSON.parse(registration.teamMembers || '[]').length > 0 ? 'Team Leader' : 'Participant'}
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <User className="w-5 h-5 text-teal-400" />
                            <div>
                                <p className="text-xs text-gray-400">Participant</p>
                                <p className="font-medium">{registration?.name || "N/A"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <Mail className="w-5 h-5 text-teal-400" />
                            <div>
                                <p className="text-xs text-gray-400">Email</p>
                                <p className="font-medium text-sm">{registration?.email || "N/A"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <Hash className="w-5 h-5 text-teal-400" />
                            <div>
                                <p className="text-xs text-gray-400">Registration ID</p>
                                <p className="font-mono text-sm">{registrationId}</p>
                            </div>
                        </div>

                        {event && (
                            <>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <Calendar className="w-5 h-5 text-amber-400" />
                                    <div>
                                        <p className="text-xs text-gray-400">Date & Time</p>
                                        <p className="font-medium">{event.date} {event.time && `• ${event.time}`}</p>
                                    </div>
                                </div>

                                {event.venue && (
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                        <MapPin className="w-5 h-5 text-amber-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">Venue</p>
                                            <p className="font-medium">{event.venue}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Team Members Section */}
                    {registration?.teamMembers && (() => {
                        const teamMembers = JSON.parse(registration.teamMembers || '[]');
                        return teamMembers.length > 0 ? (
                            <div className="px-6 pb-6 border-t border-white/10 pt-4">
                                <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4" />
                                    Team Members ({teamMembers.length})
                                </h3>
                                <div className="space-y-2">
                                    {teamMembers.map((member, index) => (
                                        <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-400 mb-1">Member {index + 2}</p>
                                                    <p className="font-medium text-sm">{member.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 mb-1">Roll No</p>
                                                    <p className="font-mono text-xs text-teal-400">{member.rollNo}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null;
                    })()}

                    {/* Footer */}
                    <div className="border-t border-white/10 p-4 text-center">
                        <p className="text-xs text-gray-500">
                            Show this QR code at the event entrance
                        </p>
                        <p className="text-xs text-teal-500 font-semibold mt-1">
                            RMC - Ramanujan Math Club
                        </p>
                    </div>
                </motion.div>

                {/* Instructions */}
                <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
                    <p>📱 Save this ticket on your phone or print it</p>
                    <p>🎫 Present at venue for entry</p>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
