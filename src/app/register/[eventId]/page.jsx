"use client";

import { useState, useRef, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, Upload, User, Mail, Hash, Briefcase, FileText, CreditCard, Users } from "lucide-react";
// import { upcomingEvents } from "@/data/upcomingEvents"; // Removed static import
import { useParams } from "next/navigation";

export default function RegistrationPage() {
    const params = useParams();
    const eventId = params.eventId;

    // State for event
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (eventId) {
            fetch('/api/events')
                .then(res => res.json())
                .then(data => {
                    const found = data.find(e => e.id == eventId);
                    setEvent(found);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching event:", err);
                    setIsLoading(false);
                });
        }
    }, [eventId]);

    // Initialize team members array when event loads
    useEffect(() => {
        if (event && event.teamSize > 1) {
            const membersCount = event.teamSize - 1; // Minus leader
            const initialMembers = Array.from({ length: membersCount }, () => ({
                name: "",
                rollNo: ""
            }));
            setTeamMembers(initialMembers);
        }
    }, [event]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        rollNo: "",
        department: "",
        utrId: ""
    });
    const [teamMembers, setTeamMembers] = useState([]); // For additional team members
    const [screenshot, setScreenshot] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [registrationId, setRegistrationId] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    // File input ref to reset it if needed
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!screenshot) {
            const msg = "Please upload the payment screenshot.";
            setErrorMessage(msg);
            alert(msg);
            return;
        }

        // Validate team members if teamSize > 1
        const teamSize = event?.teamSize || 1;
        if (teamSize > 1 && teamMembers.length !== teamSize - 1) {
            const msg = `Please fill in details for all ${teamSize} team members.`;
            setErrorMessage(msg);
            alert(msg);
            return;
        }

        // Validate each team member has required fields
        for (let i = 0; i < teamMembers.length; i++) {
            if (!teamMembers[i].name || !teamMembers[i].rollNo) {
                const msg = `Please complete all fields for Member ${i + 2}.`;
                setErrorMessage(msg);
                alert(msg);
                return;
            }
            if (!/^\d{12}$/.test(teamMembers[i].rollNo)) {
                const msg = `Member ${i + 2}: Roll Number must be exactly 12 digits.`;
                setErrorMessage(msg);
                alert(msg);
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const data = new FormData();
            // Metadata
            data.append('eventId', event.id);
            data.append('eventName', event.title);
            data.append('amount', event.registrationFee || "0");

            // Leader/Primary User Data
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('rollNo', formData.rollNo);
            data.append('department', formData.department);
            data.append('utrId', formData.utrId);

            // Team Members Data (if teamSize > 1)
            if (teamMembers.length > 0) {
                data.append('teamMembers', JSON.stringify(teamMembers));
            }

            // File
            data.append('screenshot', screenshot);

            const response = await fetch('/api/register', {
                method: 'POST',
                body: data,
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    alert("Duplicate UTR! This Transaction ID has already been used.");
                } else {
                    alert(`Registration failed: ${result.error || result.message}`);
                }
                setIsSubmitting(false);
                return;
            }

            // Success - store registration ID and QR code from response
            setRegistrationId(result.registrationId);
            setQrCodeUrl(result.qrCode); // QR code comes directly from register API
            setIsSuccess(true);

        } catch (error) {
            console.error("Submission Error:", error);
            alert("An error occurred during registration. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Event Details...</div>;
    if (!event) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Event Not Found</div>;

    return (
        <div className="min-h-[100dvh] bg-black relative flex items-center justify-center p-2 md:p-0 overflow-hidden font-sans selection:bg-teal/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.03] mix-blend-overlay" />
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-teal/10 rounded-full blur-[120px] animate-pulse duration-[4s]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            <Link href="/events" className="absolute top-4 left-4 md:top-8 md:left-8 text-white/40 hover:text-white transition-colors flex items-center z-50 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full md:bg-transparent md:p-0">
                <ArrowLeft className="w-4 h-4 mr-2" /> <span className="text-xs md:text-sm">Back</span>
            </Link>

            {/* Main Glass Card (Mobile) / Full Split (Desktop) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="w-full md:h-screen md:max-w-none md:static md:bg-transparent md:border-0 md:rounded-none md:shadow-none bg-gray-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative z-10 my-8 md:my-0"
            >
                {/* Left Panel: Event Info */}
                <div className="w-full md:w-[45%] lg:w-[40%] bg-black/40 md:bg-gray-900/20 md:backdrop-blur-xl p-6 md:p-16 flex flex-col relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5 md:h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent pointer-events-none" />

                    {/* Content Container */}
                    <div className="relative z-10 flex flex-col h-full justify-center">
                        <div className="mb-12">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-teal text-[10px] font-mono uppercase tracking-[0.2em] mb-6 md:mb-8">
                                {event.category || "Event"}
                            </span>

                            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 md:mb-6 leading-tight">
                                {event.title}
                            </h1>
                            <p className="text-white/60 text-sm md:text-lg leading-relaxed font-light">
                                {event.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-6 pt-8 border-t border-white/5">
                            <div>
                                <h4 className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-2">Timeline</h4>
                                <div className="text-white font-medium text-sm md:text-base">{event.date}</div>
                            </div>
                            <div>
                                <h4 className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-2">Fee</h4>
                                <div className="text-teal font-medium text-sm md:text-base">{event.registrationFee || "Free"}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="flex-1 bg-white/[0.02] p-6 md:p-16 overflow-y-auto md:max-h-screen" data-lenis-prevent>
                    {isSuccess ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mb-4 ring-1 ring-teal/30 shadow-[0_0_30px_-5px_rgba(45,212,191,0.3)]">
                                <CheckCircle className="w-8 h-8 text-teal" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Registration Successful!</h2>
                            <p className="text-white/50 mb-6 max-w-sm text-sm">
                                You're registered for <span className="text-teal font-medium">{event.title}</span>
                            </p>

                            {/* QR Code Display */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-6 max-w-xs">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-teal font-mono mb-4">Your Entry Pass</p>
                                <div className="bg-white rounded-xl p-3 inline-block shadow-lg">
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                                    ) : (
                                        <div className="w-48 h-48 flex items-center justify-center">
                                            <div className="w-8 h-8 border-3 border-teal border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-white/40 mt-3 font-mono">ID: {registrationId?.substring(0, 8)}...</p>
                            </div>

                            <div className="bg-teal/10 border border-teal/20 rounded-xl px-4 py-3 mb-6 max-w-sm">
                                <p className="text-teal text-sm">
                                    📧 This QR has also been sent to your email.
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                <Link
                                    href={`/ticket/${registrationId}`}
                                    className="px-6 py-3 rounded-xl bg-teal text-black font-bold uppercase tracking-widest text-xs hover:bg-teal/80 transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    🎫 Download Ticket
                                </Link>
                                <Link
                                    href="/events"
                                    className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors inline-block text-center text-sm"
                                >
                                    Back to Events
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto">
                            <h3 className="text-xl text-white font-medium mb-1">Participant Details</h3>
                            <p className="text-white/40 text-sm mb-8">Please fill in the required verification fields.</p>

                            {/* Error Message Announcement */}
                            {errorMessage && (
                                <div
                                    role="alert"
                                    aria-live="assertive"
                                    className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                                >
                                    {errorMessage}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5" aria-label="Event registration form">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="participant-name" className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Full Name</label>
                                            <input
                                                id="participant-name"
                                                name="name"
                                                required
                                                type="text"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 focus:ring-2 focus:ring-teal/50 outline-none transition-all text-base md:text-sm"
                                                placeholder="John Nash"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                aria-required="true"
                                                aria-label="Participant full name"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="participant-email" className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Email</label>
                                            <input
                                                id="participant-email"
                                                name="email"
                                                required
                                                type="email"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 focus:ring-2 focus:ring-teal/50 outline-none transition-all text-base md:text-sm"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                aria-required="true"
                                                aria-label="Participant email address"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="participant-rollno" className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Roll No</label>
                                            <input
                                                id="participant-rollno"
                                                name="rollNo"
                                                required
                                                type="text"
                                                inputMode="numeric"
                                                minLength={12}
                                                maxLength={12}
                                                pattern="\d{12}"
                                                title="Roll Number must be exactly 12 digits"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 focus:ring-2 focus:ring-teal/50 outline-none transition-all text-base md:text-sm font-mono"
                                                placeholder="1601..."
                                                value={formData.rollNo}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 12) setFormData({ ...formData, rollNo: val });
                                                }}
                                                aria-required="true"
                                                aria-label="12 digit roll number"
                                                aria-describedby="rollno-help"
                                                disabled={isSubmitting}
                                            />
                                            <p id="rollno-help" className="sr-only">Enter exactly 12 digits for your roll number</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="participant-dept" className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Dept</label>
                                            <input
                                                id="participant-dept"
                                                name="department"
                                                required
                                                type="text"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 focus:ring-2 focus:ring-teal/50 outline-none transition-all text-base md:text-sm"
                                                placeholder="CSE"
                                                value={formData.department}
                                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                aria-required="true"
                                                aria-label="Department name"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Team Members Section - Only show if teamSize > 1 */}
                                {event?.teamSize > 1 && teamMembers.length > 0 && (
                                    <div className="pt-6 border-t border-white/10">
                                        <h4 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-teal" />
                                            Additional Team Members
                                        </h4>
                                        <div className="space-y-4">
                                            {teamMembers.map((member, index) => (
                                                <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                    <p className="text-[10px] uppercase tracking-widest text-teal/70 font-mono mb-3">Member {index + 2}</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label htmlFor={`team-member-${index}-name`} className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Full Name</label>
                                                            <input
                                                                id={`team-member-${index}-name`}
                                                                name={`teamMember${index}Name`}
                                                                required
                                                                type="text"
                                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 focus:ring-2 focus:ring-teal/50 outline-none transition-all text-base md:text-sm"
                                                                placeholder="Team Member Name"
                                                                value={member.name}
                                                                onChange={e => {
                                                                    const updated = [...teamMembers];
                                                                    updated[index].name = e.target.value;
                                                                    setTeamMembers(updated);
                                                                }}
                                                                aria-required="true"
                                                                aria-label={`Team member ${index + 2} full name`}
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label htmlFor={`team-member-${index}-rollno`} className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Roll No</label>
                                                            <input
                                                                id={`team-member-${index}-rollno`}
                                                                name={`teamMember${index}RollNo`}
                                                                required
                                                                type="text"
                                                                inputMode="numeric"
                                                                minLength={12}
                                                                maxLength={12}
                                                                pattern="\d{12}"
                                                                title="Roll Number must be exactly 12 digits"
                                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 focus:ring-2 focus:ring-teal/50 outline-none transition-all text-base md:text-sm font-mono"
                                                                placeholder="1601..."
                                                                value={member.rollNo}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/\D/g, '');
                                                                    if (val.length <= 12) {
                                                                        const updated = [...teamMembers];
                                                                        updated[index].rollNo = val;
                                                                        setTeamMembers(updated);
                                                                    }
                                                                }}
                                                                aria-required="true"
                                                                aria-label={`Team member ${index + 2} 12-digit roll number`}
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-white/5">
                                    <h3 className="text-white text-sm font-medium mb-4 flex items-center">
                                        <CreditCard className="w-4 h-4 mr-2 text-teal" />
                                        Payment Verification
                                    </h3>

                                    {event.qrCode && (
                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-teal/5 border border-teal/10 mb-6">
                                            <div className="p-2 bg-white rounded-lg shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={event.qrCode} alt="QR" className="w-20 h-20 object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0 py-1">
                                                <div className="text-sm text-white font-medium mb-1">Scan to Pay <span className="text-teal ml-1">{event.registrationFee}</span></div>
                                                <p className="text-xs text-white/50 leading-relaxed">
                                                    Use any UPI app to pay the registration fee. Upload the transaction screenshot below to verify.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="utr-id" className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Transaction ID</label>
                                            <input
                                                id="utr-id"
                                                name="utrId"
                                                required
                                                type="text"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 focus:ring-2 focus:ring-teal/50 outline-none transition-all text-base md:text-sm font-mono"
                                                placeholder="Enter Transaction / UTR ID"
                                                value={formData.utrId}
                                                onChange={e => setFormData({ ...formData, utrId: e.target.value })}
                                                aria-required="true"
                                                aria-label="UPI transaction or UTR ID"
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        <div className="relative group space-y-1.5">
                                            <label htmlFor="payment-screenshot" className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Payment Screenshot</label>
                                            <input
                                                id="payment-screenshot"
                                                name="screenshot"
                                                ref={fileInputRef}
                                                required
                                                type="file"
                                                accept="image/*,application/pdf"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={handleFileChange}
                                                aria-required="true"
                                                aria-label="Upload payment screenshot or PDF"
                                                disabled={isSubmitting}
                                            />
                                            <div className="w-full bg-black/20 border border-dashed border-white/20 group-hover:border-teal/50 rounded-xl px-4 py-3 flex items-center transition-all">
                                                <Upload className="w-4 h-4 text-white/40 mr-3 group-hover:text-teal" />
                                                <span className={`text-sm ${screenshot ? 'text-teal' : 'text-white/40 group-hover:text-white/60'}`}>
                                                    {screenshot ? screenshot.name : "Upload Payment Screenshot"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full group py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-teal transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                                    aria-busy={isSubmitting}
                                    aria-label={isSubmitting ? "Submitting registration, please wait" : "Submit registration form"}
                                >
                                    {isSubmitting && (
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    )}
                                    <span className="relative z-10">{isSubmitting ? "Processing..." : "Complete Registration"}</span>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                                    {!isSubmitting && <ArrowRight className="w-3 h-3 relative z-10 group-hover:translate-x-1 transition-transform" />}

                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-20 pointer-events-none" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
