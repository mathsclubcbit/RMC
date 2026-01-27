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
        <div className="min-h-[100dvh] bg-black relative flex items-center justify-center p-2 md:p-0 overflow-hidden font-sans selection:bg-teal/30">
            {/* Background & Overlays */}
            {showPoster && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setShowPoster(false)}>
                    <button onClick={() => setShowPoster(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                            <span className="text-xs font-mono uppercase tracking-widest">Close</span>
                        </div>
                    </button>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <Image src={event.posterDesktop || event.img} alt={event.title} width={800} height={1200} className="object-contain max-h-[85vh] mx-auto bg-black" unoptimized />
                    </motion.div>
                </div>
            )}

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.03] mix-blend-overlay" />
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-teal/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <Link href="/events" className="absolute top-4 left-4 md:top-8 md:left-8 z-50 text-white/40 hover:text-white flex items-center bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full md:bg-transparent md:p-0">
                <ArrowLeft className="w-4 h-4 mr-2" /> <span className="text-xs md:text-sm">Back</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full md:h-screen bg-gray-900/40 backdrop-blur-2xl border border-white/10 md:rounded-3xl overflow-hidden flex flex-col md:flex-row relative z-10"
            >
                {/* LEFT: Event Info */}
                <div className="hidden md:flex w-[40%] bg-gray-900/20 p-16 flex-col justify-center relative overflow-hidden border-r border-white/5">
                    <div className="absolute inset-0 z-0">
                        <Image src={event.posterDesktop || event.img} alt="BG" fill sizes="40vw" className="object-cover opacity-20 blur-sm" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
                    </div>
                    <div className="relative z-10">
                        <span className="inline-block px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-teal text-[10px] font-mono uppercase tracking-[0.2em]">{event.category}</span>
                        <h1 className="text-5xl font-serif font-bold text-white mb-6 leading-tight">{event.title}</h1>
                        <p className="text-white/60 text-lg leading-relaxed mb-8">{event.description}</p>
                        <div className="flex gap-8 border-t border-white/10 pt-8">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-1">Fee</div>
                                <div className="text-teal text-lg">
                                    {event.variablePricingEnabled ? `From ${computeAmountForTeamSize(teamConstraints.minTeamSize) || 0}` : (event.registrationFee || "Free")}
                                </div>
                            </div>
                            <div><div className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-1">Date</div><div className="text-white text-lg">{event.date}</div></div>
                        </div>
                        <button onClick={() => setShowPoster(true)} className="mt-8 flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors"><FileText className="w-4 h-4" /> View Official Poster</button>
                    </div>
                </div>

                {/* RIGHT: Stepper Form */}
                <div className="flex-1 p-6 md:p-16 overflow-y-auto bg-black/20 relative">
                    {isSuccess ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-teal/30">
                                <CheckCircle className="w-10 h-10 text-teal" />
                            </motion.div>
                            <h2 className="text-3xl font-serif text-white mb-2">You&apos;re In!</h2>
                            <p className="text-white/50 mb-8">Registered for <span className="text-teal">{event.title}</span></p>

                            <div className="bg-white p-4 rounded-2xl mb-6 shadow-2xl">
                                {qrCodeUrl && <Image src={qrCodeUrl} alt="QR" width={180} height={180} unoptimized />}
                            </div>
                            <p className="text-xs text-white/30 font-mono mb-8">Ticket Code: {registrationId}</p>

                            <div className="flex gap-4">
                                <Link href="/events" className="px-6 py-3 bg-teal text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-teal/80 transition-colors">Back to Events</Link>
                            </div>

                            <div className="mt-4">
                                <TicketDownloadButton event={event} ticketCode={registrationId} qrCodeUrl={qrCodeUrl} />
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto pt-8">
                            {/* Stepper Header */}
                            <div className="flex items-center justify-between mb-12">
                                {[1, 2, 3].map((step) => {
                                    // Hide Step 2 indicator if no team
                                    if (step === 2 && (!event.teamSize || event.teamSize <= 1)) return null;

                                    const isActive = step === currentStep;
                                    const isDone = step < currentStep;

                                    return (
                                        <div key={step} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-teal text-black scale-110 shadow-[0_0_20px_rgba(45,212,191,0.3)]' : isDone ? 'bg-teal/20 text-teal' : 'bg-white/5 text-white/30'}`}>
                                                {isDone ? <CheckCircle className="w-4 h-4" /> : step}
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-widest font-mono ${isActive ? 'text-white' : 'text-white/20'}`}>
                                                {step === 1 ? 'Identity' : step === 2 ? 'Squad' : 'Payment'}
                                            </span>
                                            {step !== 3 && <div className={`w-12 h-[1px] ${isDone ? 'bg-teal/30' : 'bg-white/5'}`} />}
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
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Full Name</label>
                                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none transition-all" placeholder="Enter your full name" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">College Email</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none transition-all" placeholder="you@cbit.org.in" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Roll Number</label>
                                                <input type="text" value={formData.rollNo} onChange={e => setFormData({ ...formData, rollNo: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none transition-all font-mono" placeholder="1601..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Department</label>
                                                <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none transition-all" placeholder="CSE" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2: SQUAD */}
                                {currentStep === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div className="bg-teal/5 rounded-xl p-4 border border-teal/10 mb-4">
                                            <p className="text-teal text-xs flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                This event requires a team of {event.teamSize}.
                                            </p>
                                        </div>
                                        {teamMembers.map((member, idx) => (
                                            <div key={idx} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
                                                <div className="text-[10px] uppercase tracking-widest text-white/30 font-mono">Teammate {idx + 1}</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input type="text" placeholder="Full Name" value={member.name} onChange={e => {
                                                        const newMembers = [...teamMembers];
                                                        newMembers[idx].name = e.target.value;
                                                        setTeamMembers(newMembers);
                                                    }} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-teal/50 outline-none" />
                                                    <input type="text" placeholder="Roll Number" value={member.rollNo} onChange={e => {
                                                        const newMembers = [...teamMembers];
                                                        newMembers[idx].rollNo = e.target.value;
                                                        setTeamMembers(newMembers);
                                                    }} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-teal/50 outline-none font-mono" />
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* STEP 3: PAYMENT */}
                                {currentStep === 3 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        {/* QR Display */}
                                        {event.qrCode && (
                                            <div className="flex bg-white rounded-2xl p-4 gap-4 items-center shadow-lg">
                                                <Image src={event.qrCode} alt="Pay" width={100} height={100} className="w-24 h-24 object-contain" unoptimized />
                                                <div>
                                                    <div className="text-black font-bold text-lg mb-1">Scan to Pay</div>
                                                    <div className="text-teal-600 font-bold text-2xl">{event.registrationFee}</div>
                                                    <div className="text-xs text-gray-400 mt-1">UPI / GPay / PhonePe</div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">UTR / Transaction ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.utrId}
                                                    onChange={e => setFormData({ ...formData, utrId: e.target.value.toUpperCase() })} // Auto Uppercase
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none transition-all font-mono text-lg tracking-widest placeholder-white/10"
                                                    placeholder="XXXX..."
                                                />
                                            </div>

                                            <div className="relative group">
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                                <button onClick={() => fileInputRef.current?.click()} className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${screenshot ? 'border-teal bg-teal/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
                                                    {screenshot ? (
                                                        <>
                                                            <CheckCircle className="w-8 h-8 text-teal mb-2" />
                                                            <span className="text-teal text-sm font-medium">{screenshot.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-6 h-6 text-white/30 mb-2 group-hover:text-white" />
                                                            <span className="text-white/40 text-sm group-hover:text-white">Upload Payment Screenshot</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Navigation Actions */}
                                <div className="flex items-center gap-3 mt-10">
                                    {currentStep > 1 && (
                                        <button onClick={prevStep} className="px-6 py-4 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors uppercase font-bold text-xs tracking-widest flex items-center gap-2">
                                            <ArrowLeft className="w-4 h-4" /> Back
                                        </button>
                                    )}

                                    {currentStep < 3 ? (
                                        <button onClick={nextStep} className="flex-1 px-6 py-4 rounded-xl bg-teal text-black hover:bg-teal/80 transition-colors uppercase font-bold text-xs tracking-widest flex items-center justify-center gap-2">
                                            Next Step <ArrowRight className="w-4 h-4 " />
                                        </button>
                                    ) : (
                                        <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-teal to-emerald-500 text-black shadow-lg hover:shadow-teal/20 transition-all uppercase font-bold text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isSubmitting ? 'Processing...' : 'Complete Verification'} <CheckCircle className="w-4 h-4" />
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
