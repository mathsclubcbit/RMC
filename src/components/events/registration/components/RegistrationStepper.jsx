'use client';

import { memo } from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * RegistrationStepper - Progress indicator for multi-step registration
 * @param {{ 
 *   currentStep: number, 
 *   isHackathonOrIdeathon: boolean, 
 *   requiresTeamStep: boolean 
 * }} props
 */
function RegistrationStepper({ currentStep, isHackathonOrIdeathon, requiresTeamStep, hasTimeSlots }) {
    // Build steps array dynamically based on event features
    let steps;
    if (isHackathonOrIdeathon) {
        steps = hasTimeSlots ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
    } else {
        steps = hasTimeSlots ? [1, 2, 3, 4] : [1, 2, 3];
    }

    const getStepLabel = (step) => {
        if (hasTimeSlots) {
            if (isHackathonOrIdeathon) {
                return step === 1 ? 'Identity' : step === 2 ? 'Slot' : step === 3 ? 'Squad' : step === 4 ? 'Submission' : 'Payment';
            }
            return step === 1 ? 'Identity' : step === 2 ? 'Slot' : step === 3 ? 'Squad' : 'Payment';
        }
        if (isHackathonOrIdeathon) {
            return step === 1 ? 'Identity' : step === 2 ? 'Squad' : step === 3 ? 'Submission' : 'Payment';
        }
        return step === 1 ? 'Identity' : step === 2 ? 'Squad' : 'Payment';
    };

    return (
        <div className="flex items-center justify-between mb-8 md:mb-10 px-2 md:px-4 relative">
            {/* Mobile Progress Bar (Background) */}
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 -z-10 md:hidden" />

            {steps.map((step) => {
                // Skip team step only when it's the Squad step and team is not required
                const stepLabel = getStepLabel(step);
                if (stepLabel === 'Squad' && !requiresTeamStep) return null;

                const isActive = step === currentStep;
                const isDone = step < currentStep;

                return (
                    <div key={step} className="flex flex-col items-center gap-2 relative bg-[#020617] md:bg-transparent px-2 md:px-0 z-10">
                        <div
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono transition-all duration-500 ${isActive
                                ? 'bg-gradient-to-br from-teal to-emerald-500 text-black scale-110 shadow-[0_0_25px_rgba(45,212,191,0.4)] ring-4 ring-[#020617]'
                                : isDone
                                    ? 'bg-teal/20 text-teal ring-1 ring-teal/30'
                                    : 'bg-[#0f111a] text-white/30 ring-1 ring-white/10'
                                }`}
                        >
                            {isDone ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : step}
                        </div>
                        <span
                            className={`text-[10px] md:text-xs uppercase tracking-[0.15em] font-mono transition-colors absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap ${isActive ? 'text-teal font-bold' : 'text-white/30 hidden md:block'
                                }`}
                        >
                            {stepLabel}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default memo(RegistrationStepper);
