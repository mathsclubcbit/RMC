"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, Upload, FileText, Users, X, Info, Calendar, Trophy, Target, Shield, Phone, Sparkles } from "lucide-react";
import TicketDownloadButton from "./TicketDownloadButton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function RegistrationClient({ eventId }) {
    // Event State
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        rollNo: "",
        department: "",
        utrId: ""
    });
    const [teamMembers, setTeamMembers] = useState([]);
    const [screenshot, setScreenshot] = useState(null);
    const [pptFile, setPptFile] = useState(null);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [registrationId, setRegistrationId] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [showPoster, setShowPoster] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [modal, setModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info"
    });

    const fileInputRef = useRef(null);
    const pptInputRef = useRef(null);

    const isHackathonOrIdeathon = event?.eventType === 'Hackathon' || event?.eventType === 'Ideathon' || event?.category === 'Hackathon' || event?.category === 'Ideathon';

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

    const qrImageSrc = event?.qrCode || event?.qr || event?.qrImage || event?.qr_code || event?.qrcode || "/qr-placeholder.png";

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
                const initialMembers = Array.from({ length: minMembers }, () => ({ name: "", rollNo: "", phone: "" }));
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
            if (current.length >= maxMembers) return current;
            return [...current, { name: "", rollNo: "", phone: "" }];
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

    const handlePptChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPptFile(e.target.files[0]);
        }
    };

    const validateStep = (step) => {
        setErrorMessage("");

        if (step === 1) {
            const { name, email, phone, rollNo, department } = formData;
            if (!name || !email || !phone || !rollNo || !department) {
                setErrorMessage("Please fill in all fields.");
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setErrorMessage("Please enter a valid email address.");
                return false;
            }
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
                setErrorMessage("Please enter a valid 10-digit phone number.");
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
                if (!teamMembers[i].name || !teamMembers[i].rollNo || !teamMembers[i].phone) {
                    setErrorMessage(`Please complete details for Team Member ${i + 2}.`);
                    return false;
                }
                if (!/^[0-9]{10}$/.test(teamMembers[i].phone.replace(/\s/g, ""))) {
                    setErrorMessage(`Invalid phone number for Team Member ${i + 2}.`);
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
            if (isHackathonOrIdeathon && !pptFile) {
                setErrorMessage("Please upload your presentation (PPT/PDF).");
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
            // Scroll to top of form on step change
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        if (currentStep === 3 && !requiresTeamStep) {
            setCurrentStep(1);
        } else {
            setCurrentStep(prev => prev - 1);
        }
        setErrorMessage("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            data.append('phone', formData.phone);
            data.append('rollNo', formData.rollNo);
            data.append('department', formData.department);
            data.append('utrId', formData.utrId);

            if (teamMembers.length > 0) {
                data.append('teamMembers', JSON.stringify(teamMembers));
            }
            data.append('teamSize', String(currentTeamSize));
            data.append('screenshot', screenshot);
            if (pptFile) {
                data.append('ppt', pptFile);
            }

            const response = await fetch('/api/register', {
                method: 'POST',
                body: data,
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setModal({
                        isOpen: true,
                        title: "Duplicate Transaction",
                        message: "This UTR / Transaction ID has already been used for this event. Please check your input or contact support.",
                        type: "error"
                    });
                } else {
                    setErrorMessage(`Registration failed: ${result.error || result.message}`);
                }
                setIsSubmitting(false);
                return;
            }

            setRegistrationId(result.registrationId);
            setQrCodeUrl(result.qrCode);
            setIsSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error("Submission Error:", error);
            setErrorMessage("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [mobileTab, setMobileTab] = useState("register"); // 'details' | 'register'

    // --- RENDER HELPERS ---

    // --- Sub-Renderers for Granular Control ---
    const renderThemes = () => (
        event.themes?.length > 0 && (
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="flex items-center gap-2 text-teal font-bold mb-4 uppercase tracking-wider text-sm">
                    Themes & Tracks
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                    {event.themes.map((theme, i) => (
                        <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 text-white/90 text-sm flex items-center gap-3 hover:border-teal/30 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                            {theme}
                        </div>
                    ))}
                </div>
            </section>
        )
    );

    const renderTimeline = () => (
        event.stages?.length > 0 && (
            <div className="py-2">
                <h4 className="flex items-center gap-2 text-teal font-bold mb-8 uppercase tracking-wider text-sm pl-2">
                    <Calendar className="w-4 h-4" /> Event Journey
                </h4>
                <div className="space-y-0 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-teal/50 via-teal/20 to-transparent" />

                    {event.stages.map((stage, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="relative pl-12 pb-8 last:pb-0 group"
                        >
                            {/* Dot */}
                            <div className="absolute left-0 top-1.5 w-10 h-10 rounded-full bg-[#0f111a] border border-teal/30 z-10 flex items-center justify-center group-hover:scale-110 group-hover:border-teal transition-all shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                                <div className="w-3 h-3 rounded-full bg-teal" />
                            </div>

                            {/* Content */}
                            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5 hover:border-teal/30 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(45,212,191,0.05)]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <h5 className="text-white font-bold text-lg">{stage.name}</h5>
                                    <span className="text-teal font-mono text-[10px] bg-teal/10 px-3 py-1 rounded-full border border-teal/20 text-center w-max whitespace-nowrap">{stage.date}</span>
                                </div>
                                {/* Description Part */}
                                {stage.description && (
                                    <div className="text-white/70 text-sm mb-4 leading-relaxed space-y-1">
                                        {stage.description.includes('•') ? (
                                            stage.description.split('•').map((point, idx) => (
                                                point.trim() && (
                                                    <div key={idx} className="flex gap-2 items-start">
                                                        <span className="text-teal mt-1.5 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                                                        <span>{point.trim()}</span>
                                                    </div>
                                                )
                                            ))
                                        ) : (
                                            <p>{stage.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        )
    );

    const renderPrizes = () => (
        event.prizes && (event.prizes.winner || event.prizes.runnerUp) && (
            <div className="py-2">
                <h4 className="flex items-center gap-2 text-teal font-bold mb-4 uppercase tracking-wider text-xs pl-2 opacity-80">
                    <Trophy className="w-3.5 h-3.5" /> Prize Pool
                </h4>
                <div className="flex flex-wrap gap-3">
                    {event.prizes.winner && (
                        <div className="flex-1 min-w-[140px] bg-gradient-to-br from-yellow-500/10 to-transparent px-4 py-3 rounded-xl border border-yellow-500/20 text-center shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:border-yellow-500/40 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <Trophy className="w-5 h-5 text-yellow-500/80 mx-auto mb-1.5 group-hover:scale-110 transition-transform duration-500 relative z-10" />
                            <div className="text-yellow-200/90 font-bold text-xs uppercase tracking-wide mb-0.5 relative z-10">Winner</div>
                            <div className="text-white font-medium text-sm relative z-10">{event.prizes.winner}</div>
                        </div>
                    )}
                    {event.prizes.runnerUp && (
                        <div className="flex-1 min-w-[140px] bg-white/[0.03] px-4 py-3 rounded-xl border border-white/10 text-center">
                            <Trophy className="w-5 h-5 text-gray-400/80 mx-auto mb-1.5" />
                            <div className="text-gray-300/90 font-bold text-xs uppercase tracking-wide mb-0.5">Runner Up</div>
                            <div className="text-white font-medium text-sm">{event.prizes.runnerUp}</div>
                        </div>
                    )}
                    {event.prizes.participation && (
                        <div className="flex-1 min-w-[140px] bg-teal/5 px-4 py-3 rounded-xl border border-teal/10 text-center">
                            <Gift className="w-5 h-5 text-teal/80 mx-auto mb-1.5" />
                            <div className="text-teal/90 font-bold text-xs uppercase tracking-wide mb-0.5">Perks</div>
                            <div className="text-white font-medium text-sm">{event.prizes.participation}</div>
                        </div>
                    )}
                </div>
            </div>
        )
    );

    const renderEventDetailsContent = () => (
        <div className="space-y-8">
            {/* Description / About - Glassmorphic Card */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-teal/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <FileText className="w-24 h-24 text-teal" />
                </div>
                <h4 className="flex items-center gap-2 text-teal font-bold mb-4 uppercase tracking-wider text-sm relative z-10">
                    <FileText className="w-4 h-4" /> About The Event
                </h4>
                <p className="text-white/80 leading-relaxed text-sm md:text-base whitespace-pre-line relative z-10 font-light">{event.description}</p>
            </section>

            {renderThemes()}
            {renderTimeline()}
            {renderPrizes()}

            {/* Eligibility */}
            {event.eligibility && (
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                    <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                        <Users className="w-4 h-4" /> Eligibility
                    </h4>
                    <p className="text-white/80 text-sm leading-relaxed">{event.eligibility}</p>
                </section>
            )}

            {/* Rules */}
            {event.rules?.length > 0 && (
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                    <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                        <Info className="w-4 h-4" /> Rules & Guidelines
                    </h4>
                    <ul className="space-y-2">
                        {event.rules.map((rule, i) => (
                            <li key={i} className="flex gap-3 text-sm text-white/70">
                                <span className="text-teal mt-1.5 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                                <span className="leading-relaxed">{rule}</span>
                            </li>
                        ))}
                    </ul>
                    {isHackathonOrIdeathon && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <a
                                href={event?.samplePpt || "/sample-presentation.pptx"}
                                download={!event?.samplePpt}
                                target={event?.samplePpt ? "_blank" : "_self"}
                                rel={event?.samplePpt ? "noopener noreferrer" : ""}
                                className="flex items-center gap-2 text-teal hover:text-teal/80 transition-colors text-sm font-medium w-max"
                            >
                                <FileText className="w-4 h-4" />
                                Download Sample Presentation Format
                            </a>
                        </div>
                    )}
                </section>
            )}

            {/* Contacts */}
            {event.contactOrganizers?.length > 0 && (
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h4 className="flex items-center gap-2 text-teal font-bold mb-6 uppercase tracking-wider text-sm">
                        <Phone className="w-4 h-4" /> Organizers
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {event.contactOrganizers.map((contact, i) => (
                            <div key={i} className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10 hover:border-teal/50 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-emerald-600 text-black flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                                    {contact.name[0]}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-white font-medium truncate">{contact.name}</div>
                                    <div className="text-teal/80 text-xs font-mono mt-0.5">{contact.phone}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );

    const renderEventDetailsModal = () => (
        <motion.div
            key="details-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowDetails(false)}
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
                        onClick={() => setShowDetails(false)}
                        className="p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {renderEventDetailsContent()}
                </div>
            </motion.div>
        </motion.div>
    );
    const renderStepper = () => (
        <div className="flex items-center justify-center md:justify-between mb-8 md:mb-10 px-4">
            {[1, 2, 3].map((step) => {
                if (step === 2 && !requiresTeamStep) return null;

                const isActive = step === currentStep;
                const isDone = step < currentStep;
                const stepLabel = step === 1 ? 'Identity' : step === 2 ? 'Squad' : 'Payment';

                return (
                    <div key={step} className="flex items-center gap-2 md:gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-teal to-emerald-500 text-black scale-110 shadow-[0_0_25px_rgba(45,212,191,0.4)]' : isDone ? 'bg-teal/20 text-teal ring-1 ring-teal/30' : 'bg-white/5 text-white/30 ring-1 ring-white/10'}`}>
                            {isDone ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : step}
                        </div>
                        <span className={`text-[10px] md:text-xs uppercase tracking-[0.15em] font-mono transition-colors ${isActive ? 'text-white' : 'text-white/30'}`}>
                            {stepLabel}
                        </span>
                        {step !== 3 && <div className={`hidden md:block w-8 lg:w-16 h-px transition-colors ${isDone ? 'bg-teal/40' : 'bg-white/10'}`} />}
                    </div>
                );
            })}
        </div>
    );

    const renderStep1 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">Full Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] outline-none transition-all duration-300" placeholder="Enter your full name" />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] outline-none transition-all duration-300" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] outline-none transition-all duration-300" placeholder="9876543210" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
    );

    const renderStep2 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
            {/* Team Info Banner */}
            <div className="bg-gradient-to-r from-teal/10 to-emerald-500/5 rounded-xl p-4 border border-teal/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal" />
                    <span className="text-sm text-white/70">
                        {teamConstraints.minTeamSize === teamConstraints.maxTeamSize
                            ? `Team of ${teamConstraints.minTeamSize}`
                            : `Team: ${teamConstraints.minTeamSize}-${teamConstraints.maxTeamSize}`
                        }
                    </span>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    {event?.variablePricingEnabled && hasPricingTierForCurrentTeamSize && (
                        <span className="text-teal font-bold bg-teal/10 px-2 py-1 rounded text-sm">₹{amountToPay}</span>
                    )}
                    <span className="text-white/60 font-mono text-sm border border-white/10 px-2 py-1 rounded">{currentTeamSize}/{teamConstraints.maxTeamSize}</span>
                </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-3">
                {/* Leader Card */}
                {/* Leader Card */}
                <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 relative overflow-hidden active-ring">
                    <div className="absolute top-0 left-0 w-1 h-full bg-teal/50" />
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-teal/20 rounded-full flex items-center justify-center text-teal font-bold text-sm shrink-0 mt-1 shadow-[0_0_10px_rgba(45,212,191,0.2)]">1</div>
                        <div className="min-w-0">
                            <p className="text-white font-medium truncate group-hover:text-teal transition-colors">{formData.name || 'You'}</p>
                            <p className="text-white/40 text-xs font-mono truncate">{formData.rollNo || 'Roll No'}</p>
                            <span className="text-[10px] uppercase tracking-widest text-teal mt-1 inline-block bg-teal/10 px-2 py-0.5 rounded">Team Leader</span>
                        </div>
                    </div>
                </div>

                {/* Teammates */}
                {teamMembers.map((member, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 relative group">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white/50 font-mono text-xs shrink-0 mt-2">{idx + 2}</div>
                            <div className="flex-1 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Teammate Name"
                                    value={member.name}
                                    onChange={e => {
                                        const newMembers = [...teamMembers];
                                        newMembers[idx].name = e.target.value;
                                        setTeamMembers(newMembers);
                                    }}
                                    className="w-full bg-transparent border-b border-white/10 py-1 text-white placeholder-white/20 focus:border-teal/50 outline-none transition-all"
                                />
                                <input
                                    type="text"
                                    placeholder="Roll Number"
                                    value={member.rollNo}
                                    onChange={e => {
                                        const newMembers = [...teamMembers];
                                        newMembers[idx].rollNo = e.target.value;
                                        setTeamMembers(newMembers);
                                    }}
                                    className="w-full bg-transparent border-b border-white/10 py-1 text-white font-mono placeholder-white/20 focus:border-teal/50 outline-none transition-all"
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={member.phone}
                                    onChange={e => {
                                        const newMembers = [...teamMembers];
                                        newMembers[idx].phone = e.target.value;
                                        setTeamMembers(newMembers);
                                    }}
                                    className="w-full bg-transparent border-b border-white/10 py-1 text-white font-mono placeholder-white/20 focus:border-teal/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                        {teamMembers.length > teamConstraints.minTeamSize - 1 && (
                            <button
                                type="button"
                                onClick={() => removeTeammate(idx)}
                                className="absolute top-2 right-2 p-2 text-white/20 hover:text-red-400 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}

                {/* Add Button */}
                {currentTeamSize < teamConstraints.maxTeamSize && (
                    <button
                        type="button"
                        onClick={addTeammate}
                        className="w-full py-4 border border-dashed border-white/10 rounded-xl text-white/40 hover:text-teal hover:border-teal/30 hover:bg-teal/5 transition-all text-sm font-medium flex items-center justify-center gap-2 group"
                    >
                        <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs group-hover:scale-110 transition-transform">+</span>
                        Add Teammate
                    </button>
                )}
            </div>
        </motion.div>
    );

    const renderStep3 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-teal/10 to-black rounded-xl p-6 border border-teal/20 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Total Amount To Pay</p>
                    <div className="text-4xl font-serif font-bold text-white mb-2">
                        <span className="text-teal">₹</span>{amountToPay}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-white/40 font-mono">
                        <span>For {currentTeamSize} Member{currentTeamSize > 1 ? 's' : ''}</span>
                        {event?.variablePricingEnabled && (
                            <span className={`px-2 py-0.5 rounded-full ${hasPricingTierForCurrentTeamSize ? 'bg-teal/10 text-teal' : 'bg-red-500/10 text-red-400'}`}>
                                {hasPricingTierForCurrentTeamSize ? 'Tier Applied' : 'No Tier Found'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Scan Area */}
            {qrImageSrc && (
                <div className="bg-white p-4 rounded-xl shadow-xl mx-auto max-w-[280px]">
                    <div className="aspect-square relative rounded-lg overflow-hidden bg-white">
                        <Image src={qrImageSrc} alt="Pay" fill className="object-contain p-2" unoptimized />
                        {/* Scan Line Animation */}
                        <motion.div
                            className="absolute top-0 left-0 w-full h-1 bg-teal/50 shadow-[0_0_20px_rgba(45,212,191,0.8)]"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                    <p className="text-center text-black/60 text-xs font-mono mt-3 uppercase tracking-widest">Scan to Pay</p>
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">UTR / Transaction ID</label>
                    <input
                        type="text"
                        value={formData.utrId}
                        onChange={e => setFormData({ ...formData, utrId: e.target.value.toUpperCase() })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(45,212,191,0.1)] outline-none transition-all duration-300 font-mono text-lg tracking-widest text-center uppercase"
                        placeholder="XXXX..."
                    />
                </div>

                <div className="relative group">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${screenshot ? 'border-teal bg-teal/5' : 'border-white/10 hover:border-teal/30 hover:bg-white/[0.03]'}`}
                    >
                        {screenshot ? (
                            <>
                                <CheckCircle className="w-8 h-8 text-teal mb-2" />
                                <span className="text-teal text-sm font-medium px-4 text-center truncate w-full">{screenshot.name}</span>
                                <span className="text-xs text-white/30 mt-1">Click to change</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-white/30 mb-2 group-hover:text-teal transition-colors" />
                                <span className="text-white/50 text-sm">Upload Payment Screenshot</span>
                                <span className="text-[10px] text-white/20 mt-1">JPEG/PNG • Max 3MB</span>
                            </>
                        )}
                    </button>
                </div>

                {isHackathonOrIdeathon && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">Presentation Upload</label>
                            <a
                                href={event?.samplePpt || "/sample-presentation.pptx"}
                                download={!event?.samplePpt}
                                target={event?.samplePpt ? "_blank" : "_self"}
                                rel={event?.samplePpt ? "noopener noreferrer" : ""}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-teal hover:text-teal/80 transition-colors"
                            >
                                <FileText className="w-3 h-3" /> Download Sample PPT
                            </a>
                        </div>
                        <p className="text-white/40 text-xs leading-relaxed px-1">
                            Please upload your idea presentation following the sample format. This is mandatory for participation.
                        </p>

                        <div className="relative group">
                            <input
                                type="file"
                                ref={pptInputRef}
                                onChange={handlePptChange}
                                className="hidden"
                                accept=".ppt,.pptx,.pdf,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                            />
                            <button
                                type="button"
                                onClick={() => pptInputRef.current?.click()}
                                className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${pptFile ? 'border-teal bg-teal/5' : 'border-white/10 hover:border-teal/30 hover:bg-white/[0.03]'}`}
                            >
                                {pptFile ? (
                                    <>
                                        <CheckCircle className="w-8 h-8 text-teal mb-2" />
                                        <span className="text-teal text-sm font-medium px-4 text-center truncate w-full">{pptFile.name}</span>
                                        <span className="text-xs text-white/30 mt-1">Click to change</span>
                                    </>
                                ) : (
                                    <>
                                        <Trophy className="w-8 h-8 text-white/30 mb-2 group-hover:text-teal transition-colors" />
                                        <span className="text-white/50 text-sm">Upload Presentation</span>
                                        <span className="text-[10px] text-white/20 mt-1">PPT/PPTX/PDF • Max 10MB</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderSuccess = () => (
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

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2 tracking-wide">You&apos;re In!</h2>
            <p className="text-white/50 mb-8 max-w-xs mx-auto">Registered for <span className="text-teal block mt-1">{event.title}</span></p>

            <div className="bg-white p-4 rounded-xl mb-4 shadow-2xl">
                {qrCodeUrl && <Image src={qrCodeUrl} alt="QR" width={180} height={180} className="rounded-lg" unoptimized />}
            </div>
            <p className="text-xs text-white/30 font-mono mb-8 tracking-widest bg-white/5 px-4 py-2 rounded-full">TICKET: {registrationId}</p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <TicketDownloadButton event={event} ticketCode={registrationId} qrCodeUrl={qrCodeUrl} />
                <Link href="/events" className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 hover:border-teal/30 transition-all">
                    Back to Events
                </Link>
            </div>
        </motion.div>
    );

    const renderEventDetails = () => (
        <motion.div
            key="details-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowDetails(false)}
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
                        onClick={() => setShowDetails(false)}
                        className="p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">

                    {/* Description */}
                    <section>
                        <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                            <FileText className="w-4 h-4" /> About
                        </h4>
                        <p className="text-white/70 leading-relaxed text-sm md:text-base whitespace-pre-line">{event.description}</p>
                    </section>

                    {/* Themes */}
                    {event.themes?.length > 0 && (
                        <section>
                            <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                                <Sparkles className="w-4 h-4" /> Themes
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {event.themes.map((theme, i) => (
                                    <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 text-white/80 text-sm">
                                        {theme}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Stages / Timeline */}
                    {event.stages?.length > 0 && (
                        <section>
                            <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                                <Calendar className="w-4 h-4" /> Timeline
                            </h4>
                            <div className="space-y-4">
                                {event.stages.map((stage, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-xs shrink-0 mt-0.5 border border-teal/20">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h5 className="text-white font-medium">{stage.name}</h5>
                                            <p className="text-teal text-xs font-mono mt-1 bg-teal/10 inline-block px-2 py-0.5 rounded">{stage.date}</p>
                                            {stage.judgingCriteria && <p className="text-white/50 text-sm mt-1">{stage.judgingCriteria}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Prizes */}
                    {event.prizes && (event.prizes.winner || event.prizes.runnerUp) && (
                        <section>
                            <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                                <Trophy className="w-4 h-4" /> Prizes
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {event.prizes.winner && (
                                    <div className="bg-gradient-to-br from-yellow-500/20 to-transparent p-4 rounded-xl border border-yellow-500/30 text-center">
                                        <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                        <div className="text-yellow-200 font-bold mb-1">Winner</div>
                                        <div className="text-white text-sm">{event.prizes.winner}</div>
                                    </div>
                                )}
                                {event.prizes.runnerUp && (
                                    <div className="bg-gradient-to-br from-gray-400/20 to-transparent p-4 rounded-xl border border-gray-400/30 text-center">
                                        <Trophy className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                        <div className="text-gray-200 font-bold mb-1">Runner Up</div>
                                        <div className="text-white text-sm">{event.prizes.runnerUp}</div>
                                    </div>
                                )}
                                {event.prizes.participation && (
                                    <div className="bg-gradient-to-br from-teal/20 to-transparent p-4 rounded-xl border border-teal/30 text-center">
                                        <Target className="w-6 h-6 text-teal mx-auto mb-2" />
                                        <div className="text-teal font-bold mb-1">Participation</div>
                                        <div className="text-white text-sm">{event.prizes.participation}</div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Rules & Eligibility */}
                    <div className="grid gap-8 md:grid-cols-2">
                        {event.eligibility && (
                            <section>
                                <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                                    <Users className="w-4 h-4" /> Eligibility
                                </h4>
                                <p className="text-white/70 text-sm bg-white/5 p-4 rounded-xl border border-white/10 whitespace-pre-line">
                                    {event.eligibility}
                                </p>
                            </section>
                        )}
                        {event.rules?.length > 0 && (
                            <section>
                                <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                                    <Shield className="w-4 h-4" /> Rules
                                </h4>
                                <ul className="list-disc list-inside space-y-2 text-white/70 text-sm bg-white/5 p-4 rounded-xl border border-white/10">
                                    {event.rules.map((rule, i) => (
                                        <li key={i}>{rule}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>

                    {/* Contacts */}
                    {event.contactOrganizers?.length > 0 && (
                        <section>
                            <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                                <Phone className="w-4 h-4" /> Organizers
                            </h4>
                            <div className="flex flex-wrap gap-4">
                                {event.contactOrganizers.map((contact, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                        <div className="w-8 h-8 rounded-full bg-teal text-black flex items-center justify-center font-bold text-xs uppercase">{contact.name[0]}</div>
                                        <div>
                                            <div className="text-white text-sm font-medium">{contact.name}</div>
                                            <div className="text-white/40 text-xs font-mono">{contact.phone}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </div>
            </motion.div>
        </motion.div>
    );

    // --- MAIN RENDER ---

    if (isLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-teal font-mono animate-pulse">Initializing Interface...</div>;
    if (!event) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-red-400 font-mono">Event Data Not Found</div>;

    return (
        <div className="min-h-screen bg-[#020617] font-sans selection:bg-teal/30 selection:text-teal relative overflow-x-hidden" data-lenis-prevent>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.05),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.03),transparent_50%)]" />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
            </div>

            {/* Poster Modal - Premium Lightbox */}
            <AnimatePresence>
                {showPoster && (
                    <motion.div
                        key="poster-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                        onClick={() => setShowPoster(false)}
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
                                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">{event.title}</h3>
                                <p className="text-white/40 text-sm font-mono">{event.date} • {event.registrationFee || "Free"}</p>
                            </motion.div>

                            {/* Close button */}
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                onClick={() => setShowPoster(false)}
                                className="mt-8 flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-teal/30 transition-all group"
                            >
                                <X className="w-4 h-4" />
                                <span className="text-xs font-mono uppercase tracking-widest">Close Preview</span>
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
                {/* Event Details Modal (Desktop Overlay if needed, though mostly inline now) */}
                {showDetails && renderEventDetailsModal()}
            </AnimatePresence>

            {/* Navbar (Mobile Fixed / Desktop Absolute) */}
            <Link href="/events" className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-teal/50 transition-all md:absolute md:top-8 md:left-8">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Events</span>
            </Link>

            {/* Main Layout Container */}
            <div className="md:flex md:items-center md:justify-center md:min-h-screen md:p-6 z-10 relative">

                {/* Responsive Card Wrapper */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full md:max-w-6xl md:h-[90vh] md:bg-white/[0.02] md:backdrop-blur-2xl md:border md:border-white/10 md:rounded-[2rem] md:overflow-hidden md:flex md:shadow-2xl md:shadow-black/50"
                >
                    {/* LEFT PANEL (Desktop Only) */}
                    <div className="hidden md:flex w-[45%] bg-gradient-to-br from-black/40 to-black/20 p-12 lg:p-16 flex-col justify-start pt-20 relative border-r border-white/5 overflow-y-auto custom-scrollbar">
                        {/* Background Poster Blur */}
                        <div className="absolute inset-0 z-0 opacity-20 hover:opacity-30 transition-opacity duration-1000">
                            <Image src={event.posterDesktop || event.img} alt="BG" fill className="object-cover blur-xl scale-110" unoptimized />
                        </div>
                        <div className="relative z-10 min-h-max pb-10">
                            <span className="inline-block px-3 py-1 mb-6 rounded-full bg-teal/10 border border-teal/20 text-teal text-[10px] font-mono uppercase tracking-widest">{event.category}</span>
                            <h1 className="text-5xl font-serif font-bold text-white mb-6 leading-tight">{event.title}</h1>
                            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8 mb-8">
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-2">Registration Fee</div>
                                    <div className="text-teal text-xl font-bold">
                                        {event.variablePricingEnabled ? `₹${computeAmountForTeamSize(teamConstraints.minTeamSize) || 0}+` : (event.registrationFee || "Free")}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-2">Event Date</div>
                                    <div className="text-white text-xl">{event.date}</div>
                                </div>
                            </div>

                            {/* Filtered Event Highlights (Timeline, Prizes, Themes) */}
                            <div className="space-y-10">
                                {renderPrizes()}
                                {renderTimeline()}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-3">
                                <button onClick={() => setShowDetails(true)} className="w-full py-4 rounded-xl bg-gradient-to-r from-teal/10 to-transparent border border-teal/20 hover:border-teal/50 hover:bg-teal/20 text-teal transition-all flex items-center justify-center gap-2 group active:scale-[0.98]">
                                    <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="uppercase tracking-widest font-mono text-xs font-bold">Read Full Rulebook</span>
                                </button>

                                <button onClick={() => setShowPoster(true)} className="flex items-center justify-center gap-2 text-[10px] text-white/30 hover:text-white transition-colors py-2">
                                    <FileText className="w-3 h-3" />
                                    <span className="font-mono uppercase tracking-widest">View Official Poster</span>
                                </button>
                            </div>


                        </div>
                    </div>

                    {/* RIGHT PANEL (Hybrid Layout) */}
                    <div className="flex-1 flex flex-col relative min-h-screen md:min-h-0 md:h-full md:overflow-hidden bg-[#020617] md:bg-transparent">

                        {/* Mobile Header & Tabs */}
                        <div className="md:hidden pt-20 pb-0 bg-gradient-to-b from-[#020617] via-[#020617] to-transparent z-20 sticky top-0">
                            <div className="px-6 mb-4">
                                <h1 className="text-3xl font-serif font-bold text-white mb-2 leading-tight">{event.title}</h1>
                                <div className="flex items-center gap-4 text-xs font-mono text-white/60">
                                    <span className="bg-white/5 px-2 py-1 rounded border border-white/10">{event.date}</span>
                                    <span className="text-teal">{event.registrationFee || "Free"}</span>
                                </div>
                            </div>

                            {/* Mobile Tabs */}
                            <div className="flex border-b border-white/10 px-6 gap-6">
                                <button
                                    onClick={() => setMobileTab("register")}
                                    className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${mobileTab === 'register' ? 'text-teal border-b-2 border-teal' : 'text-white/40 hover:text-white'}`}
                                >
                                    Register
                                </button>
                                <button
                                    onClick={() => setMobileTab("details")}
                                    className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${mobileTab === 'details' ? 'text-teal border-b-2 border-teal' : 'text-white/40 hover:text-white'}`}
                                >
                                    Event Intel
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-h-0 px-6 py-6 md:px-12 md:py-8 md:overflow-y-auto custom-scrollbar" data-lenis-prevent>

                            {/* Mobile Details Tab Content (Hidden on Desktop) */}
                            <div className={`space-y-8 pb-32 md:hidden ${mobileTab === 'details' ? 'block' : 'hidden'}`}>
                                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg mb-6">
                                    <Image src={event.posterMobile || event.img} alt={event.title} fill className="object-cover" />
                                </div>
                                {renderEventDetailsContent()}
                            </div>

                            {/* Registration Content (Visible on Register Tab OR Always on Desktop) */}
                            <div className={`h-full flex flex-col pb-32 md:pb-0 ${mobileTab === 'details' ? 'hidden md:flex' : 'flex'}`}>
                                {isSuccess ? renderSuccess() : (
                                    <>
                                        {renderStepper()}

                                        <AnimatePresence mode="wait">
                                            {errorMessage && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-red-300 text-sm items-start">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
                                                    {errorMessage}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <form onSubmit={e => e.preventDefault()} className="flex-1">
                                            {currentStep === 1 && renderStep1()}
                                            {currentStep === 2 && renderStep2()}
                                            {currentStep === 3 && renderStep3()}
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions - Only visible on Register Tab or Desktop */}
                        {!isSuccess && mobileTab === 'register' && (
                            <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-[#020617]/90 backdrop-blur-lg border-t border-white/10 md:relative md:flex-shrink-0 md:p-6 md:pt-4 md:bg-transparent md:backdrop-blur-none md:border-t-0 md:border-t md:border-white/5">
                                <div className="max-w-md mx-auto flex items-center gap-4">
                                    {currentStep > 1 && (
                                        <button onClick={prevStep} className="px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                    )}

                                    {currentStep < 3 ? (
                                        <button onClick={nextStep} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-teal to-emerald-500 text-black font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all flex items-center justify-center gap-2 group">
                                            Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-teal to-emerald-500 text-black font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isSubmitting ? 'Processing...' : 'Complete Registration'} <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div >

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                confirmText="Understand"
            />
        </div >
    );
}
