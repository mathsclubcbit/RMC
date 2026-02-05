// Type definitions for User and Authentication
// These types are available for use throughout the application

/**
 * @typedef {'admin' | 'coordinator' | 'member'} UserRole
 */

/**
 * @typedef {Object} AdminUser
 * @property {string} id - Admin ID
 * @property {string} username - Admin username
 * @property {UserRole} role - User role
 * @property {boolean} has2FA - Whether 2FA is enabled
 */

/**
 * @typedef {Object} Coordinator
 * @property {string} id - Coordinator ID
 * @property {string} name - Coordinator name
 * @property {string} eventId - Assigned event ID
 * @property {string} eventName - Assigned event name
 */

/**
 * @typedef {Object} AuthState
 * @property {boolean} isAuthenticated - Whether user is logged in
 * @property {AdminUser | Coordinator | null} user - Current user
 * @property {boolean} isLoading - Loading state
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} username - Username or email
 * @property {string} password - Password
 * @property {string} [totpCode] - 2FA code (if enabled)
 */

export { };
