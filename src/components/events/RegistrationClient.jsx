"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, Upload, FileText, Users } from "lucide-react";
import TicketDownloadButton from "./TicketDownloadButton";

export default function RegistrationClient({ eventId }) {
    // Event State
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        rollNo: "",
        department: "",
        utrId: ""
    });
    const [teamMembers, setTeamMembers] = useState([]);
    const [screenshot, setScreenshot] = useState(null);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [registrationId, setRegistrationId] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [showPoster, setShowPoster] = useState(false);

    const fileInputRef = useRef(null);

    const teamConstraints = (() => {
        const legacy = Number(event?.teamSize);
        const min = Number(event?.minTeamSize);
        const max = Number(event?.maxTeamSize);

        // Backward compatibility: if min/max not set, fall back to legacy teamSize.
        if (Number.isFinite(min) || Number.isFinite(max)) {
            return {
                minTeamSize: Number.isFinite(min) && min > 0 ? min : 1,
                maxTeamSize: Number.isFinite(max) && max > 0 ? max : (Number.isFinite(min) && min > 0 ? min : 1),
            };
        }

        if (Number.isFinite(legacy) && legacy > 0) {
            return { minTeamSize: legacy, maxTeamSize: legacy };
        }

        return { minTeamSize: 1, maxTeamSize: 1 };
    })();

    const requiresTeamStep = teamConstraints.maxTeamSize > 1;
    const currentTeamSize = 1 + (Array.isArray(teamMembers) ? teamMembers.length : 0);

    const computeAmountForTeamSize = (teamSize) => {
        const parseAmount = (value) => {
            if (value == null) return 0;
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            const raw = String(value);
            const cleaned = raw.replace(/[^0-9.]/g, '');
            const n = Number(cleaned);
            return Number.isFinite(n) ? n : 0;
        };

        const enabled = !!event?.variablePricingEnabled;
        if (!enabled) {
            return parseAmount(event?.registrationFee);
        }

        const tiers = Array.isArray(event?.pricingTiers) ? event.pricingTiers : [];
        const match = tiers.find((t) => Number(t?.teamSize) === Number(teamSize));
        return parseAmount(match?.price);
    };

    const qrImageSrc = event?.qrCode || event?.qr || event?.qrImage || event?.qr_code || event?.qrcode || null;

    const hasPricingTierForCurrentTeamSize = (() => {
        if (!event?.variablePricingEnabled) return true;
        const tiers = Array.isArray(event?.pricingTiers) ? event.pricingTiers : [];
        return Boolean(tiers.find((t) => Number(t?.teamSize) === Number(currentTeamSize)));
    })();

    const amountToPay = computeAmountForTeamSize(currentTeamSize);

    // Fetch Event
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

    // Init Team
    useEffect(() => {
        if (!event) return;

        // Initialize to min team size (excluding leader).
        if (teamConstraints.maxTeamSize > 1) {
            const minMembers = Math.max(0, (teamConstraints.minTeamSize || 1) - 1);
            setTeamMembers((prev) => {
                if (Array.isArray(prev) && prev.length >= minMembers) return prev;
                const initialMembers = Array.from({ length: minMembers }, () => ({ name: "", rollNo: "" }));
                return initialMembers;
            });
        } else {
            setTeamMembers([]);
        }
    }, [event, teamConstraints.maxTeamSize, teamConstraints.minTeamSize]);

    const addTeammate = () => {
        const maxMembers = Math.max(0, teamConstraints.maxTeamSize - 1);
        setTeamMembers((prev) => {
            const current = Array.isArray(prev) ? prev : [];
            if (current.length >= maxMembers) return current;
            return [...current, { name: "", rollNo: "" }];
        });
    };

    const removeTeammate = (idx) => {
        const minMembers = Math.max(0, teamConstraints.minTeamSize - 1);
        setTeamMembers((prev) => {
            const current = Array.isArray(prev) ? [...prev] : [];
            if (current.length <= minMembers) return current;
            current.splice(idx, 1);
            return current;
        });
    };

    // Handlers
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };

    const validateStep = (step) => {
        setErrorMessage("");

        if (step === 1) {
            const { name, email, rollNo, department } = formData;
            if (!name || !email || !rollNo || !department) {
                setErrorMessage("Please fill in all fields.");
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setErrorMessage("Please enter a valid email address.");
                return false;
            }
            return true;
        }

        if (step === 2) {
            // Team Validation
            if (currentTeamSize < teamConstraints.minTeamSize) {
                setErrorMessage(`Minimum team size is ${teamConstraints.minTeamSize}.`);
                return false;
            }
            if (currentTeamSize > teamConstraints.maxTeamSize) {
                setErrorMessage(`Maximum team size is ${teamConstraints.maxTeamSize}.`);
                return false;
            }
            for (let i = 0; i < teamMembers.length; i++) {
                if (!teamMembers[i].name || !teamMembers[i].rollNo) {
                    setErrorMessage(`Please complete details for Team Member ${i + 2}.`);
                    return false;
                }
            }
            return true;
        }

        if (step === 3) {
            if (event?.variablePricingEnabled) {
                const tiers = Array.isArray(event?.pricingTiers) ? event.pricingTiers : [];
                const match = tiers.find((t) => Number(t?.teamSize) === Number(currentTeamSize));
                if (!match) {
                    setErrorMessage(`Price is not configured for team size ${currentTeamSize}. Please adjust teammates or contact the organizer.`);
                    return false;
                }
            }
            if (!formData.utrId) {
                setErrorMessage("Please enter the UTR / Transaction ID.");
                return false;
            }
            if (!screenshot) {
                setErrorMessage("Please upload the payment screenshot.");
                return false;
            }
            return true;
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            // Skip Step 2 if single player
            if (currentStep === 1 && !requiresTeamStep) {
                setCurrentStep(3);
            } else {
                setCurrentStep(prev => prev + 1);
            }
        }
    };

    const prevStep = () => {
        if (currentStep === 3 && !requiresTeamStep) {
            setCurrentStep(1);
        } else {
            setCurrentStep(prev => prev - 1);
        }
        setErrorMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(3)) return;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const data = new FormData();
            data.append('eventId', event.id);
            data.append('eventName', event.title);
            data.append('amount', String(amountToPay));
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('rollNo', formData.rollNo);
            data.append('department', formData.department);
            data.append('utrId', formData.utrId);

            if (teamMembers.length > 0) {
                data.append('teamMembers', JSON.stringify(teamMembers));
            }
            data.append('teamSize', String(currentTeamSize));
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
                    setErrorMessage(`Registration failed: ${result.error || result.message}`);
                }
                setIsSubmitting(false);
                return;
            }

            setRegistrationId(result.registrationId);
            setQrCodeUrl(result.qrCode);
            setIsSuccess(true);

        } catch (error) {
            console.error("Submission Error:", error);
            setErrorMessage("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">Loading Event...</div>;
    if (!event) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">Event Not Found</div>;

    return (
        <div className="min-h-[100dvh] bg-[#020617] relative flex items-center justify-center p-2 md:p-0 overflow-hidden font-sans selection:bg-teal/30 selection:text-teal">
            {/* Background & Overlays - Math Noir */}
            {showPoster && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl" onClick={() => setShowPoster(false)}>
                    <button onClick={() => setShowPoster(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                            <span className="text-xs font-mono uppercase tracking-widest">Close</span>
                        </div>
                    </button>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <Image src={event.posterDesktop || event.img} alt={event.title} width={800} height={1200} className="object-contain max-h-[85vh] mx-auto bg-black rounded-2xl shadow-2xl" unoptimized />
                    </motion.div>
                </div>
            )}

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.08),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.05),transparent_50%)]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.02]" />
            </div>

            <Link href="/events" className="absolute top-4 left-4 md:top-8 md:left-8 z-50 text-white/40 hover:text-white flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:border-teal/30 transition-all group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> <span className="text-xs font-mono uppercase tracking-widest">Events</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full md:max-w-6xl md:h-[90vh] bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col md:flex-row relative z-10 shadow-2xl shadow-black/50"
            >
                {/* LEFT: Event Info - Math Noir */}
                <div className="hidden md:flex w-[45%] bg-gradient-to-br from-black/40 to-black/20 p-12 lg:p-16 flex-col justify-center relative overflow-hidden border-r border-white/5">
                    <div className="absolute inset-0 z-0">
                        <Image src={event.posterDesktop || event.img} alt="BG" fill sizes="45vw" className="object-cover opacity-20 blur-md scale-105" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/95 via-[#020617]/80 to-[#020617]/95" />
                    </div>

                    {/* Decorative Math Symbol */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-serif text-white/[0.02] select-none pointer-events-none">∫</div>

                    <div className="relative z-10">
                        <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-teal/10 border border-teal/20 text-teal text-[10px] font-mono uppercase tracking-[0.25em]">{event.category}</span>
                        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-6 leading-[1.1] tracking-wide">{event.title}</h1>
                        <p className="text-white/50 text-base lg:text-lg leading-relaxed mb-10 line-clamp-4">{event.description}</p>

                        <div className="flex gap-10 border-t border-white/10 pt-8">
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono mb-2">Registration</div>
                                <div className="text-teal text-xl font-bold">
                                    {event.variablePricingEnabled ? `₹${computeAmountForTeamSize(teamConstraints.minTeamSize) || 0}+` : (event.registrationFee || "Free")}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono mb-2">Event Date</div>
                                <div className="text-white text-xl">{event.date}</div>
                            </div>
                        </div>

                        <button onClick={() => setShowPoster(true)} className="mt-10 flex items-center gap-3 text-xs text-white/40 hover:text-teal transition-colors group">
                            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="font-mono uppercase tracking-widest">View Official Poster</span>
                        </button>
                    </div>
                </div>

                {/* RIGHT: Stepper Form */}
                <div className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto relative">
                    {isSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="h-full flex flex-col items-center justify-center text-center"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                                className="w-24 h-24 bg-gradient-to-br from-teal/20 to-emerald-500/10 rounded-full flex items-center justify-center mb-8 ring-2 ring-teal/30 shadow-[0_0_40px_rgba(45,212,191,0.2)]"
                            >
                                <CheckCircle className="w-12 h-12 text-teal" />
                            </motion.div>

                            <h2 className="text-4xl font-serif font-bold text-white mb-3 tracking-wide">You&apos;re In!</h2>
                            <p className="text-white/50 mb-10 text-lg">Registered for <span className="text-teal font-medium">{event.title}</span></p>

                            <div className="bg-white p-5 rounded-2xl mb-4 shadow-2xl shadow-black/50">
                                {qrCodeUrl && <Image src={qrCodeUrl} alt="QR" width={200} height={200} unoptimized />}
                            </div>
                            <p className="text-xs text-white/30 font-mono mb-10 tracking-widest">TICKET: {registrationId}</p>

                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <Link href="/events" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 hover:border-teal/30 transition-all">Back to Events</Link>
                                <TicketDownloadButton event={event} ticketCode={registrationId} qrCodeUrl={qrCodeUrl} />
                            </div>
                        </motion.div>
                    ) : (
                        <div className="max-w-lg mx-auto pt-4 md:pt-8">
                            {/* Stepper Header - Math Noir */}
                            <div className="flex items-center justify-center md:justify-between mb-10 md:mb-14">
                                {[1, 2, 3].map((step) => {
                                    if (step === 2 && !requiresTeamStep) return null;

                                    const isActive = step === currentStep;
                                    const isDone = step < currentStep;
                                    const stepLabel = step === 1 ? 'Identity' : step === 2 ? 'Squad' : 'Payment';

                                    return (
                                        <div key={step} className="flex items-center gap-2 md:gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-teal to-emerald-500 text-black scale-110 shadow-[0_0_25px_rgba(45,212,191,0.4)]' : isDone ? 'bg-teal/20 text-teal ring-1 ring-teal/30' : 'bg-white/5 text-white/30 ring-1 ring-white/10'}`}>
                                                {isDone ? <CheckCircle className="w-5 h-5" /> : step}
                                            </div>
                                            <span className={`hidden md:block text-[10px] uppercase tracking-[0.15em] font-mono transition-colors ${isActive ? 'text-white' : 'text-white/30'}`}>
                                                {stepLabel}
                                            </span>
                                            {step !== 3 && <div className={`hidden md:block w-8 lg:w-16 h-px transition-colors ${isDone ? 'bg-teal/40' : 'bg-white/10'}`} />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Error Toast */}
                            <AnimatePresence>
                                {errorMessage && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        {errorMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Form Steps */}
                            <form onSubmit={e => e.preventDefault()}>
                                {/* STEP 1: IDENTITY */}
                                {currentStep === 1 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">Full Name</label>
                                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] outline-none transition-all duration-300" placeholder="Enter your full name" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">College Email</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] outline-none transition-all duration-300" placeholder="you@cbit.org.in" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">Roll Number</label>
                                                <input type="text" value={formData.rollNo} onChange={e => setFormData({ ...formData, rollNo: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] outline-none transition-all duration-300 font-mono" placeholder="1601..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">Department</label>
                                                <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] outline-none transition-all duration-300" placeholder="CSE" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2: SQUAD */}
                                {currentStep === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-3">
                                        {/* Compact Team Info Banner */}
                                        <div className="bg-gradient-to-r from-teal/10 to-emerald-500/5 rounded-lg px-4 py-3 border border-teal/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-teal" />
                                                <span className="text-sm text-white/70">
                                                    {teamConstraints.minTeamSize === teamConstraints.maxTeamSize
                                                        ? `Team of ${teamConstraints.minTeamSize}`
                                                        : `Team: ${teamConstraints.minTeamSize}-${teamConstraints.maxTeamSize}`
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {event?.variablePricingEnabled && hasPricingTierForCurrentTeamSize && (
                                                    <span className="text-teal font-bold">₹{amountToPay}</span>
                                                )}
                                                <span className="text-teal font-mono text-sm">{currentTeamSize}/{teamConstraints.maxTeamSize}</span>
                                            </div>
                                        </div>

                                        {/* All Team Members in Compact Grid */}
                                        <div className="space-y-2">
                                            {/* Leader Row */}
                                            <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center bg-teal/5 border border-teal/20 rounded-lg px-3 py-2">
                                                <div className="w-6 h-6 bg-teal/20 rounded-full flex items-center justify-center text-teal font-bold text-xs">1</div>
                                                <div className="text-white text-sm truncate">{formData.name || 'You'}</div>
                                                <div className="text-white/40 text-xs font-mono truncate">{formData.rollNo || 'Roll No'}</div>
                                            </div>

                                            {/* Teammate Rows */}
                                            {teamMembers.map((member, idx) => (
                                                <div
                                                    key={idx}
                                                    className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 group"
                                                >
                                                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white/50 font-mono text-xs">{idx + 2}</div>
                                                    <input
                                                        type="text"
                                                        placeholder="Name"
                                                        value={member.name}
                                                        onChange={e => {
                                                            const newMembers = [...teamMembers];
                                                            newMembers[idx].name = e.target.value;
                                                            setTeamMembers(newMembers);
                                                        }}
                                                        className="bg-transparent border-b border-white/10 px-1 py-1 text-white text-sm placeholder-white/20 focus:border-teal/50 outline-none transition-all"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Roll No"
                                                        value={member.rollNo}
                                                        onChange={e => {
                                                            const newMembers = [...teamMembers];
                                                            newMembers[idx].rollNo = e.target.value;
                                                            setTeamMembers(newMembers);
                                                        }}
                                                        className="bg-transparent border-b border-white/10 px-1 py-1 text-white text-sm font-mono placeholder-white/20 focus:border-teal/50 outline-none transition-all"
                                                    />
                                                    {teamMembers.length > teamConstraints.minTeamSize - 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTeammate(idx)}
                                                            className="text-red-400/40 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Compact Add Button */}
                                            {currentTeamSize < teamConstraints.maxTeamSize && (
                                                <button
                                                    type="button"
                                                    onClick={addTeammate}
                                                    className="w-full py-2 border border-dashed border-white/10 rounded-lg text-white/40 hover:text-teal hover:border-teal/30 transition-all text-xs font-mono"
                                                >
                                                    + Add Teammate
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: PAYMENT */}
                                {currentStep === 3 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
                                        {/* Payment Summary */}
                                        <div className="bg-gradient-to-r from-teal/10 to-emerald-500/5 rounded-xl p-5 border border-teal/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white/50 text-sm">Team Size</span>
                                                <span className="text-white font-medium">{currentTeamSize} member{currentTeamSize > 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                                <span className="text-white font-medium">Amount to Pay</span>
                                                <span className="text-teal font-bold text-2xl">₹{amountToPay}</span>
                                            </div>
                                            {event?.variablePricingEnabled && (
                                                <div className="text-xs text-white/30 mt-2 font-mono">
                                                    {hasPricingTierForCurrentTeamSize
                                                        ? `Price configured for team of ${currentTeamSize}`
                                                        : `⚠ No pricing for team size ${currentTeamSize}`
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        {/* QR Display */}
                                        {(qrImageSrc || event?.qrCode) && (
                                            <div className="flex bg-white rounded-2xl p-5 gap-5 items-center shadow-xl">
                                                <Image src={qrImageSrc || event.qrCode} alt="Pay" width={120} height={120} className="w-28 h-28 object-contain" unoptimized />
                                                <div>
                                                    <div className="text-gray-800 font-bold text-lg mb-1">Scan to Pay</div>
                                                    <div className="text-teal-600 font-bold text-3xl">₹{amountToPay}</div>
                                                    <div className="text-xs text-gray-400 mt-2">UPI / GPay / PhonePe</div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-5 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">UTR / Transaction ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.utrId}
                                                    onChange={e => setFormData({ ...formData, utrId: e.target.value.toUpperCase() })}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] outline-none transition-all duration-300 font-mono text-lg tracking-widest"
                                                    placeholder="XXXX..."
                                                />
                                            </div>

                                            <div className="relative group">
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${screenshot ? 'border-teal bg-teal/5' : 'border-white/10 hover:border-teal/30 hover:bg-white/[0.03]'}`}
                                                >
                                                    {screenshot ? (
                                                        <>
                                                            <CheckCircle className="w-10 h-10 text-teal mb-3" />
                                                            <span className="text-teal text-sm font-medium">{screenshot.name}</span>
                                                            <span className="text-xs text-white/30 mt-1">Click to change</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-8 h-8 text-white/30 mb-3 group-hover:text-teal transition-colors" />
                                                            <span className="text-white/50 text-sm group-hover:text-white transition-colors">Upload Payment Screenshot</span>
                                                            <span className="text-xs text-white/30 mt-1">PNG, JPG up to 3MB</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Navigation Actions */}
                                <div className="flex items-center gap-4 mt-12">
                                    {currentStep > 1 && (
                                        <button onClick={prevStep} className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 uppercase font-bold text-xs tracking-widest flex items-center gap-2 group">
                                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                                        </button>
                                    )}

                                    {currentStep < 3 ? (
                                        <button onClick={nextStep} className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-teal to-emerald-500 text-black hover:shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all duration-300 uppercase font-bold text-xs tracking-widest flex items-center justify-center gap-2 group">
                                            Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-teal to-emerald-500 text-black shadow-lg hover:shadow-[0_0_40px_rgba(45,212,191,0.4)] transition-all duration-300 uppercase font-bold text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                                            {isSubmitting ? 'Processing...' : 'Complete Registration'} <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
