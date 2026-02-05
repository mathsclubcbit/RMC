'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing team members state
 * @param {{ minTeamSize: number, maxTeamSize: number }} teamConstraints
 */
export function useTeamMembers(teamConstraints) {
    const [teamMembers, setTeamMembers] = useState([]);

    // Initialize team members based on constraints
    useEffect(() => {
        if (teamConstraints.maxTeamSize > 1) {
            const minMembers = Math.max(0, teamConstraints.minTeamSize - 1);
            setTeamMembers(prev => {
                if (Array.isArray(prev) && prev.length >= minMembers) return prev;
                return Array.from({ length: minMembers }, () => ({
                    name: '', email: '', rollNo: '', phone: ''
                }));
            });
        }
    }, [teamConstraints]);

    const addTeammate = useCallback(() => {
        const maxMembers = teamConstraints.maxTeamSize - 1;
        setTeamMembers(prev => {
            const current = Array.isArray(prev) ? prev : [];
            if (current.length >= maxMembers) return current;
            return [...current, { name: '', email: '', rollNo: '', phone: '' }];
        });
    }, [teamConstraints.maxTeamSize]);

    const removeTeammate = useCallback((index) => {
        const minMembers = Math.max(0, teamConstraints.minTeamSize - 1);
        setTeamMembers(prev => {
            const current = Array.isArray(prev) ? prev : [];
            if (current.length <= minMembers) return current;
            return current.filter((_, i) => i !== index);
        });
    }, [teamConstraints.minTeamSize]);

    const updateTeammate = useCallback((index, data) => {
        setTeamMembers(prev => {
            const updated = [...prev];
            updated[index] = data;
            return updated;
        });
    }, []);

    const currentTeamSize = 1 + (Array.isArray(teamMembers) ? teamMembers.length : 0);

    return {
        teamMembers,
        setTeamMembers,
        addTeammate,
        removeTeammate,
        updateTeammate,
        currentTeamSize
    };
}

export default useTeamMembers;
