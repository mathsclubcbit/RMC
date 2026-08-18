'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * RegistrationStepper - "Tactical Segment" Design
 * A clean, segmented progress bar with clear typographical hierarchy.
 */
function RegistrationStepper({ currentStep, isHackathonOrIdeathon, requiresTeamStep, hasTimeSlots, isQuiz }) {
    // 1. Determine base steps
    let baseSteps;
    if (isHackathonOrIdeathon) {
        baseSteps = hasTimeSlots ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
    } else {
        baseSteps = hasTimeSlots ? [1, 2, 3, 4] : [1, 2, 3];
    }

    // 2. Helper to get labels
    const getStepLabel = (step) => {
        if (hasTimeSlots) {
            if (isHackathonOrIdeathon) {
                return step === 1 ? 'Personal' : step === 2 ? 'Slot' : step === 3 ? 'Team' : step === 4 ? 'Review' : 'Payment';
            }
            return step === 1 ? 'Personal' : step === 2 ? 'Slot' : step === 3 ? 'Team' : 'Payment';
        }
        if (isHackathonOrIdeathon) {
            return step === 1 ? 'Personal' : step === 2 ? 'Team' : step === 3 ? 'Review' : 'Payment';
        }
        return step === 1 ? 'Personal' : step === 2 ? 'Team' : 'Payment';
    };

    // 3. Filter valid steps (removing Team if not needed)
    const validSteps = baseSteps.filter(step => {
        const label = getStepLabel(step);
        if (label === 'Team' && !requiresTeamStep) return false;
        if (label === 'Payment' && isQuiz) return false;
        return true;
    });

    return (
        <div className="w-full mb-8">
            {/* Header / Active Step Info */}
            <div className="flex items-end justify-between mb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
                        Registration Process
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-white tracking-tight">
                            {getStepLabel(currentStep)}
                        </span>
                        <span className="text-sm font-mono text-zinc-500">
                            (Step {validSteps.indexOf(currentStep) + 1} of {validSteps.length})
                        </span>
                    </div>
                </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="flex gap-2 h-1 w-full">
                {validSteps.map((step, index) => {
                    const isActive = step === currentStep;
                    const isDone = validSteps.indexOf(currentStep) > index;
                    
                    return (
                        <div key={step} className="flex-1">
                            {/* Bar Segment */}
                            <div 
                                className={`h-full w-full rounded-full transition-all duration-300
                                    ${isActive 
                                        ? 'bg-white' 
                                        : isDone 
                                            ? 'bg-zinc-600' 
                                            : 'bg-zinc-800'
                                    }
                                `}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(RegistrationStepper);
