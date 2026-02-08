/**
 * Validation utilities for registration form
 */

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[0-9]{10}$/;

/**
 * Validate personal info (Step 1)
 * @param {object} formData - Form data with name, email, phone, rollNo, department
 * @returns {string | null} Error message or null if valid
 */
export function validatePersonalInfo(formData) {
    if (!formData.name || formData.name.trim() === '') {
        return 'Please enter your full name.';
    }

    if (!formData.email || formData.email.trim() === '') {
        return 'Please enter your email address.';
    }

    if (!emailRegex.test(formData.email)) {
        return 'Please enter a valid email address.';
    }

    if (!formData.phone) {
        return 'Please enter your phone number.';
    }

    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        return 'Phone number must be exactly 10 digits.';
    }

    if (!formData.rollNo) {
        return 'Please enter your roll number.';
    }

    if (!/^\d{12}$/.test(formData.rollNo)) {
        return 'Roll Number must be exactly 12 digits.';
    }

    if (!formData.department || formData.department.trim() === '') {
        return 'Please enter your department.';
    }

    return null;
}

/**
 * Validate team members (Step 2)
 * @param {Array} teamMembers - Array of team member objects
 * @param {{ minTeamSize: number, maxTeamSize: number }} teamConstraints
 * @param {number} currentTeamSize
 * @returns {string | null} Error message or null if valid
 */
export function validateTeamMembers(teamMembers, teamConstraints, currentTeamSize) {
    if (currentTeamSize < teamConstraints.minTeamSize) {
        return `Minimum team size is ${teamConstraints.minTeamSize}.`;
    }

    if (currentTeamSize > teamConstraints.maxTeamSize) {
        return `Maximum team size is ${teamConstraints.maxTeamSize}.`;
    }

    for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];

        if (!member.name || !member.email || !member.rollNo || !member.phone) {
            return `Please complete details for Team Member ${i + 2}.`;
        }

        if (!emailRegex.test(member.email)) {
            return `Invalid email for Team Member ${i + 2}.`;
        }

        if (!phoneRegex.test(member.phone.replace(/\s/g, ''))) {
            return `Invalid phone number for Team Member ${i + 2}.`;
        }
    }

    return null;
}

/**
 * Validate submission step (Hackathon/Ideathon)
 * @param {string} abstract - Project abstract
 * @param {File | null} pptFile - Presentation file
 * @param {boolean} isIdeathon - Whether the event is an ideathon
 * @returns {string | null} Error message or null if valid
 */
export function validateSubmission(abstract, pptFile, isIdeathon = false) {
    if (!pptFile) {
        return isIdeathon
            ? 'Please upload your abstract document.'
            : 'Please upload your presentation (PPT/PDF).';
    }

    return null;
}

/**
 * Validate payment step
 * @param {string} utrId - UTR/Transaction ID
 * @param {File | null} screenshot - Payment screenshot
 * @param {object} event - Event data
 * @param {number} currentTeamSize - Current team size
 * @param {(size: number) => boolean} hasPricingTierForTeamSize - Function to check pricing tier
 * @returns {string | null} Error message or null if valid
 */
export function validatePayment(utrId, screenshot, event, currentTeamSize, hasPricingTierForTeamSize) {
    if (event?.variablePricingEnabled && !hasPricingTierForTeamSize(currentTeamSize)) {
        return `No pricing tier configured for team size ${currentTeamSize}. Please adjust your team.`;
    }

    if (!utrId || utrId.trim() === '') {
        return 'Please enter your UTR / Transaction ID.';
    }

    if (!screenshot) {
        return 'Please upload your payment screenshot.';
    }

    return null;
}
