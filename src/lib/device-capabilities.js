/**
 * Device Capabilities Detection
 * Determines device performance tier for adaptive loading strategies
 */

export function getDeviceCapabilities() {
    if (typeof window === 'undefined') {
        // Server-side default to medium
        return 'medium';
    }

    // Hardware metrics
    const memory = navigator.deviceMemory || 4; // GB (default to 4GB if unavailable)
    const cores = navigator.hardwareConcurrency || 4; // CPU cores
    const connection = navigator.connection?.effectiveType || '4g';

    // Connection speed check
    const isSlowConnection = ['slow-2g', '2g', '3g'].includes(connection);

    // Low-end device detection
    if (memory < 4 || cores < 4 || isSlowConnection) {
        return 'low';
    }

    // High-end device detection
    if (memory >= 8 && cores >= 8 && !isSlowConnection) {
        return 'high';
    }

    // Default to medium
    return 'medium';
}

/**
 * Get recommended settings based on device capabilities
 */
export function getPerformanceSettings(tier = null) {
    const capability = tier || getDeviceCapabilities();

    const settings = {
        low: {
            enable3D: false,
            enableCanvasBackground: false,
            enableParallax: false,
            enableCustomCursor: false,
            imageQuality: 50,
            enableAnimations: false,
            particleCount: 0,
        },
        medium: {
            enable3D: true,
            enableCanvasBackground: true,
            enableParallax: true,
            enableCustomCursor: true,
            imageQuality: 60,
            enableAnimations: true,
            particleCount: 2000,
        },
        high: {
            enable3D: true,
            enableCanvasBackground: true,
            enableParallax: true,
            enableCustomCursor: true,
            imageQuality: 75,
            enableAnimations: true,
            particleCount: 12000,
        },
    };

    return settings[capability] || settings.medium;
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 'ontouchstart' in window;
}

/**
 * Get battery status if available
 */
export async function getBatteryStatus() {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
        return null;
    }

    try {
        const battery = await navigator.getBattery();
        return {
            charging: battery.charging,
            level: battery.level,
            isLowPower: battery.level < 0.2 && !battery.charging,
        };
    } catch {
        return null;
    }
}
