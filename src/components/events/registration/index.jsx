'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles, FileText, Users, Shield, Info } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// Local imports - hooks
import { useEventData } from './hooks/useEventData';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useRegistrationForm } from './hooks/useRegistrationForm';

// Local imports - components
import {
    PosterModal,
    EventDetailsContent,
    EventDetailsModal,
    RegistrationStepper,
    SuccessView
} from './components';

// Local imports - steps
import {
    PersonalInfoStep,
    TeamStep,
    SubmissionStep,
    PaymentStep
} from './steps';

// Local imports - utils
import {
    validatePersonalInfo,
    validateTeamMembers,
    validateSubmission,
    validatePayment
} from './utils/validation';

/**
 * RegistrationClient - Main registration component (refactored)
 * Uses extracted hooks, components, and validation utilities
 */
export default function RegistrationClient({ eventId }) {
    // Event data hook
    const {
        event,
        isLoading,
        isHackathonOrIdeathon,
        isIdeathon,
        teamConstraints,
        requiresTeamStep,
        qrImageSrc,
        computeAmountForTeamSize,
        hasPricingTierForTeamSize
    } = useEventData(eventId);

    // Team members hook
    const {
        teamMembers,
        addTeammate,
        removeTeammate,
        updateTeammate,
        currentTeamSize
    } = useTeamMembers(teamConstraints);

    // Form state hook
    const {
        formData,
        setFormData,
        updateField,
        screenshot,
        setScreenshot,
        pptFile,
        setPptFile,
        abstract,
        setAbstract,
        errorMessage,
        setErrorMessage
    } = useRegistrationForm();

    // Step navigation state
    const [currentStep, setCurrentStep] = useState(1);

    // UI state
    const [showPoster, setShowPoster] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [mobileTab, setMobileTab] = useState('register');
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [registrationId, setRegistrationId] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);

    // Event Highlights Banner - Shows key info upfront
    const renderEventHighlights = () => (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Event Type Badge */}
            {isIdeathon && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Abstract Required
                </span>
            )}
            {isHackathonOrIdeathon && !isIdeathon && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[10px] font-bold uppercase tracking-wider">
                    <FileText className="w-3 h-3" />
                    PPT Required
                </span>
            )}

            {/* Team Size Badge */}
            {teamConstraints.maxTeamSize > 1 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-mono uppercase tracking-wider">
                    <Users className="w-3 h-3" />
                    {teamConstraints.minTeamSize === teamConstraints.maxTeamSize
                        ? `Team of ${teamConstraints.minTeamSize}`
                        : `${teamConstraints.minTeamSize}-${teamConstraints.maxTeamSize} Members`}
                </span>
            )}

            {/* Sample Abstract Download (for Ideathon) */}
            {isIdeathon && event?.sampleAbstract && (
                <a
                    href={event.sampleAbstract}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider hover:bg-purple-500/20 transition-colors"
                >
                    <FileText className="w-3 h-3" />
                    📄 Sample Abstract (PDF/DOC)
                </a>
            )}

            {/* Sample PPT Download */}
            {event?.samplePpt && (
                <a
                    href={event.samplePpt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/30 text-teal text-[10px] font-bold uppercase tracking-wider hover:bg-teal/20 transition-colors"
                >
                    <FileText className="w-3 h-3" />
                    📊 Sample PPT (Presentation)
                </a>
            )}
        </div>
    );

    // Computed values
    const amountToPay = useMemo(() =>
        computeAmountForTeamSize(currentTeamSize),
        [computeAmountForTeamSize, currentTeamSize]
    );

    const hasPricingTierForCurrentTeamSize = useMemo(() =>
        hasPricingTierForTeamSize(currentTeamSize),
        [hasPricingTierForTeamSize, currentTeamSize]
    );

    // Validation
    const validateStep = useCallback((step) => {
        setErrorMessage('');

        if (step === 1) {
            const error = validatePersonalInfo(formData);
            if (error) {
                setErrorMessage(error);
                return false;
            }
            return true;
        }

        if (step === 2) {
            const error = validateTeamMembers(teamMembers, teamConstraints, currentTeamSize);
            if (error) {
                setErrorMessage(error);
                return false;
            }
            return true;
        }

        if (step === 3) {
            if (isHackathonOrIdeathon) {
                const error = validateSubmission(abstract, pptFile, isIdeathon);
                if (error) {
                    setErrorMessage(error);
                    return false;
                }
                return true;
            } else {
                const error = validatePayment(formData.utrId, screenshot, event, currentTeamSize, hasPricingTierForTeamSize);
                if (error) {
                    setErrorMessage(error);
                    return false;
                }
                return true;
            }
        }

        if (step === 4) {
            const error = validatePayment(formData.utrId, screenshot, event, currentTeamSize, hasPricingTierForTeamSize);
            if (error) {
                setErrorMessage(error);
                return false;
            }
            return true;
        }

        return true;
    }, [formData, teamMembers, teamConstraints, currentTeamSize, isHackathonOrIdeathon, abstract, pptFile, screenshot, event, hasPricingTierForTeamSize, setErrorMessage]);

    // Navigation
    const nextStep = useCallback(() => {
        if (validateStep(currentStep)) {
            setErrorMessage('');
            if (currentStep === 1 && !requiresTeamStep) {
                setCurrentStep(3);
            } else {
                setCurrentStep(prev => prev + 1);
            }
        }
    }, [currentStep, validateStep, requiresTeamStep, setErrorMessage]);

    const prevStep = useCallback(() => {
        setErrorMessage('');
        if (currentStep === 3 && !requiresTeamStep) {
            setCurrentStep(1);
        } else {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep, requiresTeamStep, setErrorMessage]);

    // Form submission
    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault();

        const lastStep = isHackathonOrIdeathon ? 4 : 3;
        if (!validateStep(lastStep)) return;

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const fd = new FormData();
            fd.append('eventId', eventId);
            fd.append('eventName', event?.title || '');
            fd.append('name', formData.name);
            fd.append('email', formData.email);
            fd.append('phone', formData.phone);
            fd.append('rollNo', formData.rollNo);
            fd.append('department', formData.department);
            fd.append('utrId', formData.utrId);
            fd.append('amount', String(amountToPay));
            fd.append('teamSize', String(currentTeamSize));

            if (teamMembers.length > 0) {
                fd.append('teamMembers', JSON.stringify(teamMembers));
            }

            if (screenshot) {
                fd.append('screenshot', screenshot);
            }

            if (isHackathonOrIdeathon) {
                fd.append('abstract', abstract);
                if (pptFile) {
                    fd.append('ppt', pptFile);
                }
            }

            const res = await fetch('/api/register', { method: 'POST', body: fd });
            const data = await res.json();

            if (!res.ok) {
                if (data.error === 'UTR_ALREADY_USED') {
                    setErrorMessage('This UTR/Transaction ID has already been used. Please check your payment details.');
                } else if (data.error === 'TEAM_SIZE_MISMATCH') {
                    setErrorMessage('Team size mismatch. Please refresh and try again.');
                } else if (data.error === 'PRICE_NOT_CONFIGURED') {
                    setErrorMessage(`No price configured for team size ${data.teamSize}. Please contact support.`);
                } else {
                    setErrorMessage(data.error || 'Registration failed. Please try again.');
                }
                return;
            }

            setRegistrationId(data.registrationId);
            setQrCodeUrl(data.qrCode);
            setIsSuccess(true);
        } catch (err) {
            console.error('Submit error:', err);
            setErrorMessage('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [eventId, event, formData, teamMembers, screenshot, pptFile, abstract, amountToPay, currentTeamSize, isHackathonOrIdeathon, validateStep, setErrorMessage]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center text-teal font-mono animate-pulse">
                Initializing Interface...
            </div>
        );
    }

    // Error state
    if (!event) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center text-red-400 font-mono">
                Event Data Not Found
            </div>
        );
    }

    // Render step content
    const renderStepContent = () => {
        if (currentStep === 1) {
            return (
                <PersonalInfoStep
                    formData={formData}
                    onFieldChange={updateField}
                />
            );
        }

        if (currentStep === 2) {
            return (
                <TeamStep
                    formData={formData}
                    teamMembers={teamMembers}
                    teamConstraints={teamConstraints}
                    currentTeamSize={currentTeamSize}
                    amountToPay={amountToPay}
                    hasPricingTierForCurrentTeamSize={hasPricingTierForCurrentTeamSize}
                    variablePricingEnabled={event?.variablePricingEnabled}
                    onAddTeammate={addTeammate}
                    onRemoveTeammate={removeTeammate}
                    onUpdateTeammate={updateTeammate}
                />
            );
        }

        if (currentStep === 3) {
            if (isHackathonOrIdeathon) {
                return (
                    <SubmissionStep
                        abstract={abstract}
                        setAbstract={setAbstract}
                        pptFile={pptFile}
                        onPptChange={setPptFile}
                        samplePptUrl={event?.samplePpt}
                        sampleAbstractUrl={event?.sampleAbstract}
                        isIdeathon={isIdeathon}
                    />
                );
            }
            return (
                <PaymentStep
                    utrId={formData.utrId}
                    onUtrChange={(value) => setFormData(prev => ({ ...prev, utrId: value }))}
                    screenshot={screenshot}
                    onScreenshotChange={setScreenshot}
                    amountToPay={amountToPay}
                    currentTeamSize={currentTeamSize}
                    variablePricingEnabled={event?.variablePricingEnabled}
                    hasPricingTierForCurrentTeamSize={hasPricingTierForCurrentTeamSize}
                    qrImageSrc={qrImageSrc}
                />
            );
        }

        if (currentStep === 4) {
            return (
                <PaymentStep
                    utrId={formData.utrId}
                    onUtrChange={(value) => setFormData(prev => ({ ...prev, utrId: value }))}
                    screenshot={screenshot}
                    onScreenshotChange={setScreenshot}
                    amountToPay={amountToPay}
                    currentTeamSize={currentTeamSize}
                    variablePricingEnabled={event?.variablePricingEnabled}
                    hasPricingTierForCurrentTeamSize={hasPricingTierForCurrentTeamSize}
                    qrImageSrc={qrImageSrc}
                />
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-[#020617] font-sans selection:bg-teal/30 selection:text-teal relative overflow-x-hidden" data-lenis-prevent>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.05),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.03),transparent_50%)]" />
                {/* Noise texture removed for performance */}
            </div>

            {/* Poster Modal */}
            <AnimatePresence>
                {showPoster && (
                    <PosterModal
                        event={event}
                        isOpen={showPoster}
                        onClose={() => setShowPoster(false)}
                    />
                )}
                {showDetails && (
                    <EventDetailsModal
                        event={event}
                        isOpen={showDetails}
                        onClose={() => setShowDetails(false)}
                        isHackathonOrIdeathon={isHackathonOrIdeathon}
                        isIdeathon={isIdeathon}
                    />
                )}
            </AnimatePresence>

            {/* Navbar */}
            <Link
                href="/events"
                className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-teal/50 transition-all md:absolute md:top-8 md:left-8 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Events</span>
            </Link>

            {/* Main Layout Container */}
            <div className="md:flex md:items-center md:justify-center md:min-h-screen md:p-6 z-10 relative">
                {/* Responsive Card Wrapper */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full min-h-screen md:min-h-0 md:w-[95vw] md:max-w-7xl md:rounded-3xl md:border md:border-white/10 md:bg-[#0f111a]/95 md:backdrop-blur-xl md:shadow-2xl md:overflow-hidden flex flex-col md:max-h-[90vh]"
                >
                    {/* Desktop: Side-by-side layout */}
                    <div className="flex-1 flex flex-col md:flex-row min-h-0">
                        {/* Left Panel - Event Details (Desktop Only) */}
                        <div className="hidden md:flex flex-col w-[40%] lg:w-[45%] bg-[#080a12] border-r border-white/10 overflow-hidden relative group">
                            {/* Poster Section - REMOVED for cleaner look per user request */}

                            {/* Event Info */}
                            <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                                <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white mb-2 tracking-wide">{event.title}</h1>

                                {/* Event Highlights Banner */}
                                {renderEventHighlights()}

                                <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-6 flex items-center gap-2 mt-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                                    {event.date} • {event.eventType}
                                </p>

                                {/* Submission Requirements Callout (for Hackathon/Ideathon) */}
                                {isHackathonOrIdeathon && (
                                    <div className="mb-8 bg-gradient-to-r from-purple-500/10 to-teal/5 rounded-xl p-5 border border-purple-500/20">
                                        <h4 className="flex items-center gap-2 text-purple-300 font-bold mb-3 uppercase tracking-wider text-xs">
                                            <Sparkles className="w-4 h-4" />
                                            Submission Requirements
                                        </h4>
                                        <p className="text-white/60 text-sm leading-relaxed mb-3">
                                            {isIdeathon
                                                ? "Submit your abstract document outlining your innovative idea. Judges will evaluate creativity, feasibility, and impact."
                                                : "Submit a presentation (PPT/PDF) showcasing your project concept, tech stack, and implementation approach."
                                            }
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                            {event?.sampleAbstract && isIdeathon && (
                                                <a
                                                    href={event.sampleAbstract}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider hover:bg-purple-500/30 transition-colors w-full sm:w-auto"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    📄 Abstract Format (PDF/DOC)
                                                </a>
                                            )}
                                            {event?.samplePpt && (
                                                <a
                                                    href={event.samplePpt}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal/20 border border-teal/30 text-teal text-xs font-bold uppercase tracking-wider hover:bg-teal/30 transition-colors w-full sm:w-auto"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    📊 PPT Template
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Inline Rules Preview */}
                                {event.rules?.length > 0 && (
                                    <div className="mb-8 bg-white/5 rounded-xl p-5 border border-white/10">
                                        <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-xs">
                                            <Shield className="w-4 h-4" />
                                            Key Rules
                                        </h4>
                                        <ul className="space-y-2">
                                            {event.rules.slice(0, 3).map((rule, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-white/70">
                                                    <span className="text-teal mt-1.5 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                                                    <span className="leading-relaxed">{rule}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {event.rules.length > 3 && (
                                            <button
                                                onClick={() => setShowDetails(true)}
                                                className="mt-3 text-teal/70 hover:text-teal text-xs font-mono transition-colors"
                                            >
                                                + {event.rules.length - 3} more rules →
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="mb-8 border-t border-white/10 pt-6">
                                    <button
                                        onClick={() => setShowDetails(true)}
                                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <Info className="w-4 h-4" />
                                        <span className="uppercase tracking-widest text-xs font-bold">View All Details</span>
                                    </button>

                                    <button
                                        onClick={() => setShowPoster(true)}
                                        className="w-full mt-3 py-2 text-white/40 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-mono flex items-center justify-center gap-2"
                                    >
                                        <FileText className="w-3 h-3" />
                                        View Poster
                                    </button>
                                </div>

                                {/* EventDetailsContent removed from inline view per user request. 
                                    Access via "View All Details" button which opens modal. */}
                            </div>
                        </div>

                        {/* Right Panel - Registration Form */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                            {/* Mobile Header */}
                            <div className="pt-16 pb-4 px-6 md:pt-8 md:px-12 flex-shrink-0 md:hidden">
                                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1 tracking-wide">{event.title}</h2>
                                <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-3">{event.date}</p>
                                {/* Event Highlights (Mobile) */}
                                {renderEventHighlights()}
                            </div>

                            {/* Desktop Header spacer */}
                            <div className="hidden md:block h-8 flex-shrink-0" />

                            {/* Mobile Tabs */}
                            <div className="px-6 border-b border-white/10 md:hidden mb-4">
                                <div className="flex relative">
                                    <button
                                        onClick={() => setMobileTab('register')}
                                        className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all z-10 ${mobileTab === 'register' ? 'text-teal' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Register
                                    </button>
                                    <button
                                        onClick={() => setMobileTab('details')}
                                        className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all z-10 ${mobileTab === 'details' ? 'text-teal' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Event Intel
                                    </button>

                                    {/* Animated Tab Indicator */}
                                    <motion.div
                                        className="absolute bottom-0 h-[2px] bg-teal shadow-[0_0_10px_rgba(45,212,191,0.5)] w-1/2"
                                        animate={{ x: mobileTab === 'register' ? '0%' : '100%' }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 min-h-0 px-6 md:px-12 pb-6 md:pb-8 md:overflow-y-auto custom-scrollbar" data-lenis-prevent>
                                {/* Mobile Details Tab Content */}
                                <div className={`space-y-8 pb-32 md:hidden ${mobileTab === 'details' ? 'block' : 'hidden'}`}>
                                    <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg mb-6">
                                        <Image
                                            src={event.posterMobile || event.img}
                                            alt={event.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                    <EventDetailsContent
                                        event={event}
                                        isHackathonOrIdeathon={isHackathonOrIdeathon}
                                        isIdeathon={isIdeathon}
                                    />
                                </div>

                                {/* Registration Content */}
                                <div className={`h-full flex flex-col pb-32 md:pb-0 ${mobileTab === 'details' ? 'hidden md:flex' : 'flex'}`}>
                                    {isSuccess ? (
                                        <SuccessView
                                            event={event}
                                            registrationId={registrationId}
                                            qrCodeUrl={qrCodeUrl}
                                        />
                                    ) : (
                                        <>
                                            <RegistrationStepper
                                                currentStep={currentStep}
                                                isHackathonOrIdeathon={isHackathonOrIdeathon}
                                                requiresTeamStep={requiresTeamStep}
                                            />

                                            <AnimatePresence mode="wait">
                                                {errorMessage && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-red-300 text-sm items-start overflow-hidden"
                                                    >
                                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
                                                        {errorMessage}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <form onSubmit={e => e.preventDefault()} className="flex-1 relative">
                                                <motion.div
                                                    key={currentStep}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {renderStepContent()}
                                                </motion.div>
                                            </form>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            {!isSuccess && mobileTab === 'register' && (
                                <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-[#020617]/90 backdrop-blur-lg border-t border-white/10 md:relative md:flex-shrink-0 md:p-6 md:pt-4 md:bg-transparent md:backdrop-blur-none md:border-t-0 md:border-t md:border-white/5">
                                    <div className="max-w-md mx-auto flex items-center gap-4">
                                        {currentStep > 1 && (
                                            <button
                                                onClick={prevStep}
                                                className="px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/30 transition-all active:scale-95"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                        )}

                                        {currentStep < (isHackathonOrIdeathon ? 4 : 3) ? (
                                            <button
                                                onClick={nextStep}
                                                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-teal to-emerald-500 text-black font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                                            >
                                                Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-teal to-emerald-500 text-black font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                                            >
                                                {isSubmitting ? 'Processing...' : 'Complete Registration'} <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                confirmText="Understand"
            />
        </div>
    );
}
