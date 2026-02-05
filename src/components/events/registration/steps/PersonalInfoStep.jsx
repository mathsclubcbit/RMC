'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { PremiumInput } from '../components';

/**
 * PersonalInfoStep - Step 1: Collect personal information
 * @param {{ 
 *   formData: object, 
 *   onFieldChange: (field: string, value: string) => void 
 * }} props
 */
function PersonalInfoStep({ formData, onFieldChange }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <PremiumInput
                label="Full Name"
                value={formData.name}
                onChange={e => onFieldChange('name', e.target.value)}
                placeholder="Enter your full name"
            />

            <PremiumInput
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={e => onFieldChange('email', e.target.value)}
                placeholder="you@example.com"
            />

            <PremiumInput
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={e => onFieldChange('phone', e.target.value)}
                placeholder="Enter your phone number"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <PremiumInput
                    label="Roll Number"
                    value={formData.rollNo}
                    onChange={e => onFieldChange('rollNo', e.target.value)}
                    placeholder="1601..."
                    className="font-mono"
                />
                <PremiumInput
                    label="Department"
                    value={formData.department}
                    onChange={e => onFieldChange('department', e.target.value)}
                    placeholder="CSE, AIML, AIDS..."
                />
            </div>
        </motion.div>
    );
}

export default memo(PersonalInfoStep);
