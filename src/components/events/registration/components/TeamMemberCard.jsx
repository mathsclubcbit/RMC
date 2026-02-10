'use client';

import { memo } from 'react';
import { X } from 'lucide-react';
import PremiumInput from './PremiumInput';

/**
 * TeamMemberCard - Individual team member form
 * @param {{ 
 *   member: { name: string, email: string, rollNo: string, phone: string }, 
 *   index: number, 
 *   onChange: (index: number, data: object) => void, 
 *   onRemove: (index: number) => void, 
 *   canRemove: boolean 
 * }} props
 */
function TeamMemberCard({ member, index, onChange, onRemove, canRemove }) {
    const handleChange = (field, value) => {
        onChange(index, { ...member, [field]: value });
    };

    return (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 relative group hover:bg-white/[0.04] transition-colors">
            <div className="flex items-start gap-3 mb-1">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white/50 font-mono text-xs shrink-0 mt-3 shadow-inner">
                    {index + 2}
                </div>
                <div className="flex-1 space-y-1">
                    <PremiumInput
                        variant="minimal"
                        placeholder="Teammate Name"
                        value={member.name}
                        onChange={e => handleChange('name', e.target.value)}
                    />
                    <PremiumInput
                        variant="minimal"
                        type="email"
                        placeholder="Email Address"
                        value={member.email}
                        onChange={e => handleChange('email', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <PremiumInput
                            variant="minimal"
                            placeholder="Roll No"
                            value={member.rollNo}
                            onChange={e => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                handleChange('rollNo', value);
                            }}
                            maxLength={12}
                            inputMode="numeric"
                            className="font-mono text-sm"
                        />
                        <PremiumInput
                            variant="minimal"
                            type="tel"
                            placeholder="Phone"
                            value={member.phone}
                            onChange={e => handleChange('phone', e.target.value)}
                            className="font-mono text-sm"
                        />
                    </div>
                </div>
            </div>
            {canRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="absolute top-2 right-2 p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

export default memo(TeamMemberCard);
