/**
 * API endpoint constants
 * Use these instead of hardcoded API paths
 * 
 * @example
 * import { API_ENDPOINTS } from '@/constants';
 * fetch(API_ENDPOINTS.EVENTS);
 */
export const API_ENDPOINTS = {
    // Events
    EVENTS: '/api/events',
    EVENT_BY_ID: (id) => `/api/events/${id}`,

    // Registration
    REGISTER: '/api/register',

    // Admin
    ADMIN_LOGIN: '/api/admin/login',
    ADMIN_LOGOUT: '/api/admin/logout',
    ADMIN_VERIFY: '/api/admin/verify',
    ADMIN_EVENTS: '/api/admin/events',

    // Coordinator
    COORDINATOR_LOGIN: '/api/coordinator/login',
    COORDINATOR_LOGOUT: '/api/coordinator/logout',
    COORDINATOR_VERIFY: '/api/coordinator/verify',
    COORDINATOR_SCAN: '/api/coordinator/scan',

    // Hub
    HUB: '/api/hub',
    HUB_UPLOAD: '/api/hub/upload',

    // Newsletter
    NEWSLETTER_SUBSCRIBE: '/api/newsletter/subscribe',
    NEWSLETTER_UNSUBSCRIBE: '/api/newsletter/unsubscribe',
    NEWSLETTER_SEND: '/api/newsletter/send',

    // Notifications
    NOTIFICATIONS_SUBSCRIBE: '/api/notifications/subscribe',
    NOTIFICATIONS_SEND: '/api/notifications/send',

    // Announcements
    ANNOUNCEMENTS: '/api/announcements',

    // Network
    NETWORK_AUTH: '/api/network/auth',
    NETWORK_PROFILE: '/api/network/profile',

    // Tasks
    TASKS: '/api/tasks',
};

/**
 * HTTP status codes for reference
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_ERROR: 500,
};
