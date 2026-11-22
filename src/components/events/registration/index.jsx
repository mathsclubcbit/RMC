'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, MapPin, Calendar, Clock, Banknote, Lock, CalendarX } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { isEventRegistrationClosed } from '@/lib/utils';

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
    PaymentStep,
    TimeSlotStep
} from './steps';

// Local imports - utils
import {
    validatePersonalInfo,
    validateTeamMembers,
    validateSubmission,
    validatePayment,
    validateTimeSlot
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
        hasTimeSlots,
        timeSlots,
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
        selectedTimeSlot,
        setSelectedTimeSlot,
        errorMessage,
        setErrorMessage
    } = useRegistrationForm();

    // Slot counts for capacity display
    const [slotCounts, setSlotCounts] = useState({});

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

    // Fetch slot counts when event has time slots
    useEffect(() => {
        if (hasTimeSlots && eventId) {
            fetch(`/api/events/${eventId}/slot-counts`)
                .then(r => r.ok ? r.json() : { slotCounts: {} })
                .then(data => setSlotCounts(data.slotCounts || {}))
                .catch(() => setSlotCounts({}));
        }
    }, [hasTimeSlots, eventId]);

    /**
     * Step type mapping — maps a numeric step to its semantic meaning
     * based on event features (hasTimeSlots, isHackathonOrIdeathon, requiresTeamStep).
     *
     * Flow WITHOUT time slots (current):
     *   General:  1=Personal, 2=Team, 3=Payment
     *   H/I:     1=Personal, 2=Team, 3=Submission, 4=Payment
     *
     * Flow WITH time slots:
     *   General:  1=Personal, 2=TimeSlot, 3=Team, 4=Payment
     *   H/I:     1=Personal, 2=TimeSlot, 3=Team, 4=Submission, 5=Payment
     */
    const isQuiz = event?.eventType === 'Quiz';

    const getStepType = useCallback((step) => {
        let steps = ['personal', 'team'];
        if (hasTimeSlots) steps.splice(1, 0, 'timeslot');
        if (isHackathonOrIdeathon) steps.push('submission');
        if (!isQuiz) steps.push('payment');
        
        return steps[step - 1] || null;
    }, [hasTimeSlots, isHackathonOrIdeathon, isQuiz]);

    const isLastStep = useMemo(() => {
        // Find the highest step number that is valid
        let highest = 1;
        for (let i = 1; i <= 5; i++) {
            const type = getStepType(i);
            if (!type) continue;
            if (type === 'team' && !requiresTeamStep) continue;
            highest = i;
        }
        return currentStep >= highest;
    }, [currentStep, getStepType, requiresTeamStep]);

    // Event Highlights Banner - Removed in favor of new Info Grid

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
        const stepType = getStepType(step);

        if (stepType === 'personal') {
            const error = validatePersonalInfo(formData);
            if (error) { setErrorMessage(error); return false; }
            return true;
        }

        if (stepType === 'timeslot') {
            const error = validateTimeSlot(selectedTimeSlot);
            if (error) { setErrorMessage(error); return false; }
            return true;
        }

        if (stepType === 'team') {
            const error = validateTeamMembers(teamMembers, teamConstraints, currentTeamSize);
            if (error) { setErrorMessage(error); return false; }
            return true;
        }

        if (stepType === 'submission') {
            const error = validateSubmission(abstract, pptFile, isIdeathon);
            if (error) { setErrorMessage(error); return false; }
            return true;
        }

        if (stepType === 'payment') {
            const error = validatePayment(formData.utrId, screenshot, event, currentTeamSize, hasPricingTierForTeamSize);
            if (error) { setErrorMessage(error); return false; }
            return true;
        }

        return true;
    }, [formData, teamMembers, teamConstraints, currentTeamSize, isHackathonOrIdeathon, abstract, pptFile, screenshot, event, hasPricingTierForTeamSize, setErrorMessage, getStepType, selectedTimeSlot]);

    // Navigation — skip team step if not required
    const nextStep = useCallback(() => {
        if (validateStep(currentStep)) {
            setErrorMessage('');
            // If current step is right before the team step and team is not required, skip it
            let nextStepNum = currentStep + 1;
            const nextType = getStepType(nextStepNum);
            if (nextType === 'team' && !requiresTeamStep) {
                nextStepNum += 1;
            }
            setCurrentStep(nextStepNum);
        }
    }, [currentStep, validateStep, requiresTeamStep, setErrorMessage, getStepType]);

    const prevStep = useCallback(() => {
        setErrorMessage('');
        let prevStepNum = currentStep - 1;
        const prevType = getStepType(prevStepNum);
        if (prevType === 'team' && !requiresTeamStep) {
            prevStepNum -= 1;
        }
        setCurrentStep(prevStepNum);
    }, [currentStep, requiresTeamStep, setErrorMessage, getStepType]);

    // Form submission
    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault();

        e?.preventDefault();

        if (!validateStep(currentStep)) return;

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

            if (hasTimeSlots && selectedTimeSlot) {
                fd.append('selectedTimeSlot', selectedTimeSlot);
            }

            const res = await fetch('/api/register', { method: 'POST', body: fd });
            const data = await res.json();

            if (!res.ok) {
                if (data.error === 'UTR_ALREADY_USED') {
                    setErrorMessage('This UTR/Transaction ID has already been used. Please check your payment details.');
                } else if (data.error === 'TEAM_SIZE_MISMATCH') {
                    setErrorMessage('Team size mismatch. Please refresh and try again.');
                } else if (data.error === 'SLOT_FULL') {
                    setErrorMessage('This time slot is now full. Please go back and select a different slot.');
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
    }, [eventId, event, formData, teamMembers, screenshot, pptFile, abstract, amountToPay, currentTeamSize, isHackathonOrIdeathon, validateStep, setErrorMessage, isLastStep, hasTimeSlots, selectedTimeSlot, currentStep]);

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

    // ── Past-event gate ──────────────────────────────────────────────────────
    // If the event's registration deadline (or event date) has already passed,
    // block the form entirely and show an informational ended-state screen.
    if (isEventRegistrationClosed(event)) {
        return <EventEndedView event={event} />;
    }

    // Render step content based on step type
    const renderStepContent = () => {
        const stepType = getStepType(currentStep);

        if (stepType === 'personal') {
            return (
                <PersonalInfoStep
                    formData={formData}
                    onFieldChange={updateField}
                />
            );
        }

        if (stepType === 'timeslot') {
            return (
                <TimeSlotStep
                    timeSlots={timeSlots}
                    slotCounts={slotCounts}
                    selectedTimeSlot={selectedTimeSlot}
                    onSelect={setSelectedTimeSlot}
                />
            );
        }

        if (stepType === 'team') {
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

        if (stepType === 'submission') {
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

        if (stepType === 'payment') {
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
        <div className="min-h-screen bg-black font-sans text-white selection:bg-white/20">
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
                className="fixed top-6 left-6 z-50 flex items-center gap-3 px-4 py-2 bg-zinc-900/80 backdrop-blur-sm hover:bg-zinc-800 border border-white/5 rounded-full transition-all group"
            >
                <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white">BACK</span>
            </Link>

            {/* Main Layout */}
            <div className="min-h-screen md:flex">
                {/* Left Panel - Event Info (Desktop) */}
                <div className="hidden md:flex flex-col w-[40%] xl:w-[35%] bg-zinc-950 border-r border-white/5 relative">
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        {/* Poster */}
                        {(event.posterMobile || event.img) && (
                            <div className="relative aspect-video w-full rounded-sm overflow-hidden mb-12 border border-white/10 group cursor-pointer" onClick={() => setShowPoster(true)}>
                                <Image
                                    src={event.posterMobile || event.img}
                                    alt={event.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs font-mono uppercase tracking-widest text-white">View Poster</span>
                                </div>
                            </div>
                        )}

                        {/* Title & Metadata */}
                        <div className="mb-12">
                            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">{event.title}</h1>
                            <div className="flex flex-wrap gap-3">
                                {event?.category && (
                                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                                        {event.category}
                                    </span>
                                )}
                                {event?.venueType && (
                                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                                        {event.venueType}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-12">
                            <MetricWrapper icon={Calendar} label="Date" value={event.date} />
                            <MetricWrapper icon={Clock} label="Type" value={event.eventType} />
                        </div>


                        {/* Rules */}
                        {event.rules?.length > 0 && (
                            <div className="mb-12">
                                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest mb-4">Guidelines</h3>
                                <ul className="space-y-3">
                                    {event.rules.slice(0, 3).map((rule, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-zinc-400">
                                            <span className="w-1 h-1 rounded-full bg-zinc-600 mt-2 shrink-0" />
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Footer Links */}
                        <div className="mt-auto pt-8 border-t border-white/5 flex gap-6">
                            {isHackathonOrIdeathon && (
                                <div className="flex gap-4 ml-auto">
                                    {event?.sampleAbstract && isIdeathon && (
                                        <MetricActionLink href={event.sampleAbstract} label="Abstract" />
                                    )}
                                    {event?.samplePpt && (
                                        <MetricActionLink href={event.samplePpt} label="PPT Template" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form (Mobile & Desktop) */}
                <div className="flex-1 flex flex-col h-screen md:h-auto overflow-hidden bg-black relative">
                    {/* Mobile Header */}
                    <div className="md:hidden pt-20 pb-6 px-6 border-b border-white/5 shrink-0">
                        <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                            <span>{event.date}</span>
                            <span>•</span>
                            <span>{event.eventType}</span>
                        </div>
                    </div>

                    {/* Mobile Tabs */}
                    <div className="md:hidden flex border-b border-white/5">
                        <button
                            onClick={() => setMobileTab('register')}
                            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${mobileTab === 'register' ? 'bg-white/5 text-white' : 'text-zinc-600'}`}
                        >
                            Register
                        </button>
                        <button
                            onClick={() => setMobileTab('details')}
                            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${mobileTab === 'details' ? 'bg-white/5 text-white' : 'text-zinc-600'}`}
                        >
                            Details
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar" data-lenis-prevent>
                        <div className="p-6 md:p-12 lg:p-24 max-w-4xl mx-auto w-full">
                            
                            {/* Mobile Details Tab */}
                            <div className={`space-y-8 pb-32 md:hidden ${mobileTab === 'details' ? 'block' : 'hidden'}`}>
                                <EventDetailsContent event={event} isHackathonOrIdeathon={isHackathonOrIdeathon} isIdeathon={isIdeathon}/>
                            </div>

                            {/* Registration Form */}
                            <div className={`flex flex-col pb-32 md:pb-0 ${mobileTab === 'details' ? 'hidden md:flex' : 'flex'}`}>
                                {isSuccess ? (
                                    <SuccessView event={event} registrationId={registrationId} qrCodeUrl={qrCodeUrl} />
                                ) : (
                                    <>
                                        {/* Stepper */}
                                        <div className="mb-12">
                                            <RegistrationStepper
                                                currentStep={currentStep}
                                                isHackathonOrIdeathon={isHackathonOrIdeathon}
                                                requiresTeamStep={requiresTeamStep}
                                                hasTimeSlots={hasTimeSlots}
                                                isQuiz={isQuiz}
                                            />
                                        </div>

                                        {/* Error Message */}
                                        <AnimatePresence mode="wait">
                                            {errorMessage && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="mb-8 p-4 bg-red-950/20 border-l-2 border-red-500 text-red-200 text-sm"
                                                >
                                                    <span className="font-mono text-red-500 font-bold mr-2">ERROR:</span>
                                                    {errorMessage}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Dynamic Form Step */}
                                        <form onSubmit={e => e.preventDefault()}>
                                            <motion.div
                                                key={currentStep}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.4, ease: "circOut" }}
                                            >
                                                {renderStepContent()}
                                            </motion.div>
                                        </form>

                                        {/* Desktop Footer Actions (Inline) */}
                                        <div className="hidden md:flex items-center gap-4 mt-12 pt-8 border-t border-white/5">
                                            {currentStep > 1 && (
                                                <button
                                                    onClick={prevStep}
                                                    className="px-6 py-3 rounded-sm border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all text-sm font-medium"
                                                >
                                                    Back
                                                </button>
                                            )}
                                            <button
                                                onClick={!isLastStep ? nextStep : handleSubmit}
                                                disabled={isSubmitting}
                                                className="flex-1 px-6 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? 'Processing...' : (!isLastStep ? 'Continue' : 'Submit Registration')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Footer Actions (Fixed) */}
                    {!isSuccess && mobileTab === 'register' && (
                        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-white/10 z-20">
                            <div className="flex gap-3">
                                {currentStep > 1 && (
                                    <button
                                        onClick={prevStep}
                                        className="px-4 py-3 bg-zinc-900 text-white rounded-sm"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={!isLastStep ? nextStep : handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Processing...' : (!isLastStep ? 'Continue' : 'Submit')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                confirmText="Close"
            />
        </div>
    );
}

/**
 * Helper component for information metrics - Simple version
 */
function MetricWrapper({ icon: Icon, label, value }) {
    return (
        <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-sm">
            <div className="flex items-center gap-3 mb-2">
                <Icon className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">{label}</span>
            </div>
             <p className="text-sm font-medium text-zinc-200">{value}</p>
        </div>
    );
}

/**
 * Helper component for simple links
 */
function MetricActionLink({ href, label }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-white border-b border-zinc-700 hover:border-white pb-0.5 transition-colors"
        >
            {label}
        </a>
    );
}

/**
 * EventEndedView — Full-page gate shown when a past event's registration page
 * is visited directly. Preserves event context while making it clear that
 * registration is no longer available.
 */
function EventEndedView({ event }) {
    return (
        <div className="min-h-screen bg-black font-sans text-white flex flex-col">
            {/* Back nav */}
            <Link
                href="/events"
                className="fixed top-6 left-6 z-50 flex items-center gap-3 px-4 py-2 bg-zinc-900/80 backdrop-blur-sm hover:bg-zinc-800 border border-white/5 rounded-full transition-all group"
            >
                <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white">BACK</span>
            </Link>

            <div className="flex-1 flex items-center justify-center px-4 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-full max-w-lg text-center"
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                            <CalendarX className="w-9 h-9 text-zinc-500" />
                        </div>
                    </div>

                    {/* Event poster thumbnail (if available) */}
                    {(event.posterMobile || event.posterDesktop || event.img) && (
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden mx-auto mb-8 border border-white/10 opacity-50">
                            <Image
                                src={event.posterMobile || event.posterDesktop || event.img}
                                alt={event.title}
                                fill
                                className="object-cover grayscale"
                            />
                        </div>
                    )}

                    {/* Category badge */}
                    {(event.eventType || event.category) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-5 rounded-full border border-white/10 text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-zinc-900/50">
                            <Lock className="w-2.5 h-2.5" />
                            {event.eventType || event.category}
                        </span>
                    )}

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight tracking-tight">
                        {event.title}
                    </h1>

                    {/* Date */}
                    {event.date && (
                        <p className="flex items-center justify-center gap-2 text-sm font-mono text-zinc-500 mb-8">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                        </p>
                    )}

                    {/* Divider */}
                    <div className="w-16 h-px bg-white/10 mx-auto mb-8" />

                    {/* Message */}
                    <p className="text-zinc-400 text-base leading-relaxed mb-2">
                        This event has already concluded.
                    </p>
                    <p className="text-zinc-600 text-sm mb-10">
                        Registration is now closed.
                    </p>

                    {/* CTA */}
                    <Link
                        href="/events"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-zinc-200 transition-colors"
                    >
                        Browse Other Events
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
