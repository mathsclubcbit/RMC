'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if a media query matches
 * @param {string} query - CSS media query string
 * @returns {boolean} Whether the media query matches
 * 
 * @example
 * const isLargeScreen = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        // Set initial value
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        // Create listener
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        // Cleanup
        return () => media.removeEventListener('change', listener);
    }, [query, matches]);

    return matches;
}

/**
 * Hook to detect if current viewport is mobile-sized
 * @returns {boolean} Whether viewport is mobile (< 768px)
 * 
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) { // Show mobile UI }
 */
export function useIsMobile() {
    return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect if current viewport is tablet-sized
 * @returns {boolean} Whether viewport is tablet (768px - 1023px)
 */
export function useIsTablet() {
    return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook to detect if current viewport is desktop-sized
 * @returns {boolean} Whether viewport is desktop (>= 1024px)
 */
export function useIsDesktop() {
    return useMediaQuery('(min-width: 1024px)');
}
