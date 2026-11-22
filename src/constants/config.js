/**
 * Application configuration constants
 */

// Site metadata
export const SITE_CONFIG = {
    name: 'RMC',
    fullName: 'Ramanujan Mathematics Club',
    tagline: 'Journey to Infinity',
    description: 'The official mathematics club of CBIT',
    url: 'https://www.rmccbit.in',
    email: 'rmc@cbit.ac.in',
};

// Social links
export const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/rmc_cbit',
    linkedin: 'https://linkedin.com/company/rmc-cbit',
    twitter: 'https://twitter.com/rmc_cbit',
};

// File upload limits
export const UPLOAD_LIMITS = {
    maxFileSize: 3 * 1024 * 1024, // 3MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocTypes: ['application/pdf'],
};

// Pagination defaults
export const PAGINATION = {
    defaultPageSize: 10,
    maxPageSize: 50,
};

// Animation durations (in ms)
export const ANIMATION = {
    fast: 150,
    normal: 300,
    slow: 500,
    pageTransition: 400,
};

// Breakpoints (match Tailwind defaults)
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};
