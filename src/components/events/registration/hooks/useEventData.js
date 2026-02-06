'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Custom hook for fetching and processing event data
 * @param {string} eventId - The event ID to fetch
 */
export function useEventData(eventId) {
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!eventId) {
            Promise.resolve().then(() => setIsLoading(false));
            return;
        }

        fetch('/api/events')
            .then(res => res.json())
            .then(data => {
                const found = data.find(e => e.id == eventId);
                setEvent(found);
            })
            .catch(err => {
                console.error("Error fetching event:", err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [eventId]);

    const isHackathonOrIdeathon = useMemo(() => {
        return event?.eventType === 'Hackathon' ||
            event?.eventType === 'Ideathon' ||
            event?.category === 'Hackathon' ||
            event?.category === 'Ideathon';
    }, [event]);

    const teamConstraints = useMemo(() => {
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
    }, [event]);

    const requiresTeamStep = teamConstraints.maxTeamSize > 1;

    const qrImageSrc = useMemo(() => {
        return event?.qrCode || event?.qr || event?.qrImage || '/qr-placeholder.png';
    }, [event]);

    // Helper to compute amount for a given team size
    const computeAmountForTeamSize = useCallback((teamSize) => {
        const parseAmount = (value) => {
            if (value == null) return 0;
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            const raw = String(value);
            const cleaned = raw.replace(/[^0-9.]/g, '');
            const n = Number(cleaned);
            return Number.isFinite(n) ? n : 0;
        };

        if (!event) return 0;

        if (Boolean(event?.variablePricingEnabled)) {
            const tiers = Array.isArray(event?.pricingTiers) ? event.pricingTiers : [];
            const tier = tiers.find((t) => Number(t?.teamSize) === Number(teamSize));
            const price = parseAmount(tier?.price);
            return Number.isFinite(price) && price >= 0 ? price : 0;
        }

        const fee = parseAmount(event?.registrationFee);
        return Number.isFinite(fee) && fee >= 0 ? fee : 0;
    }, [event]);

    // Helper to check if pricing tier exists for a team size
    const hasPricingTierForTeamSize = useCallback((teamSize) => {
        if (!event?.variablePricingEnabled) return true;
        const tiers = Array.isArray(event?.pricingTiers) ? event.pricingTiers : [];
        return Boolean(tiers.find((t) => Number(t?.teamSize) === Number(teamSize)));
    }, [event]);

    return {
        event,
        isLoading,
        isHackathonOrIdeathon,
        teamConstraints,
        requiresTeamStep,
        qrImageSrc,
        computeAmountForTeamSize,
        hasPricingTierForTeamSize
    };
}

export default useEventData;
