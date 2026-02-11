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
        <div className="relative group/card p-6 border border-zinc-900 bg-black/40 hover:bg-zinc-900/20 hover:border-zinc-800 transition-all duration-300">
            <div className="flex items-start gap-4 md:gap-6">
                <div className="w-8 pt-4 shrink-0 text-right">
                    <span className="font-mono text-xs text-zinc-600 block">
                        {(index + 2).toString().padStart(2, '0')}
                    </span>
                </div>
                
                <div className="flex-1 min-w-0 space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                        <PremiumInput
                            variant="minimal"
                            label="Name"
                            placeholder="Full Name"
                            value={member.name}
                            onChange={e => handleChange('name', e.target.value)}
                        />
                        <PremiumInput
                            variant="minimal"
                            label="Email"
                            type="email"
                            placeholder="email@college.edu"
                            value={member.email}
                            onChange={e => handleChange('email', e.target.value)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <PremiumInput
                            variant="minimal"
                            label="Roll No"
                            placeholder="1234567890"
                            value={member.rollNo}
                            onChange={e => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                handleChange('rollNo', value);
                            }}
                            maxLength={12}
                            inputMode="numeric"
                        />
                        <PremiumInput
                            variant="minimal"
                            label="Phone"
                            type="tel"
                            placeholder="9999999999"
                            value={member.phone}
                            onChange={e => handleChange('phone', e.target.value)}
                        />
                    </div>
                </div>

                {canRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="absolute top-0 right-0 p-4 opacity-0 group-hover/card:opacity-100 transition-opacity text-zinc-600 hover:text-red-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

export default memo(TeamMemberCard);
