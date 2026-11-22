/**
 * Application route paths
 * Use these instead of hardcoded strings for maintainability
 * 
 * @example
 * import { ROUTES } from '@/constants';
 * router.push(ROUTES.ADMIN_EVENTS);
 */
export const ROUTES = {
    // Public routes
    HOME: '/',
    ABOUT: '/about',
    EVENTS: '/events',
    GALLERY: '/gallery',
    CONTACT: '/contact',
    HUB: '/hub',
    TEAM: '/team',
    JOIN: '/join',
    ANNOUNCEMENTS: '/announcements',
    RESOURCES: '/resources',

    // Registration
    REGISTER: '/register',

    // Admin routes
    ADMIN: '/admin',
    ADMIN_LOGIN: '/admin/login',
    ADMIN_EVENTS: '/admin/events',
    ADMIN_GALLERY: '/admin/gallery',
    ADMIN_NEWSLETTER: '/admin/newsletter',
    ADMIN_TEAM: '/admin/team',
    ADMIN_ANNOUNCEMENTS: '/admin/announcements',
    ADMIN_HUB: '/admin/hub',
    ADMIN_SCAN: '/admin/scan',
    ADMIN_SETUP_2FA: '/admin/setup-2fa',

    // Coordinator routes
    COORDINATOR: '/coordinator',
    COORDINATOR_LOGIN: '/coordinator/login',
    COORDINATOR_DASHBOARD: '/coordinator/dashboard',
    COORDINATOR_SCAN: '/coordinator/scan',
    COORDINATOR_EDIT: '/coordinator/edit',

    // Network routes
    NETWORK: '/network',
    NETWORK_LOGIN: '/network/login',
    NETWORK_DASHBOARD: '/network/dashboard',
    NETWORK_CALENDAR: '/network/calendar',
    NETWORK_TEAMS: '/network/teams',
    NETWORK_TASKS: '/network/tasks',
    NETWORK_RESOURCES: '/network/resources',
    NETWORK_SETTINGS: '/network/settings',
};

/**
 * Helper to generate dynamic routes
 */
export const dynamicRoutes = {
    /**
     * Generate event registration route
     * @param {string} eventId 
     * @returns {string}
     */
    register: (eventId) => `/register/${eventId}`,

    /**
     * Generate event details route
     * @param {string} eventId 
     * @returns {string}
     */
    event: (eventId) => `/events/${eventId}`,

    /**
     * Generate admin event edit route
     * @param {string} eventId 
     * @returns {string}
     */
    adminEventEdit: (eventId) => `/admin/events/${eventId}`,

    /**
     * Generate ticket view route
     * @param {string} ticketId 
     * @returns {string}
     */
    ticket: (ticketId) => `/admin/ticket/${ticketId}`,
};
