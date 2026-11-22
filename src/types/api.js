// Type definitions for API requests and responses
// These types are available for use throughout the application

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request succeeded
 * @property {*} [data] - Response data (if successful)
 * @property {string} [error] - Error message (if failed)
 * @property {string} [message] - Additional message
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} items - Array of items
 * @property {number} total - Total count
 * @property {number} page - Current page
 * @property {number} pageSize - Items per page
 * @property {boolean} hasMore - Whether more pages exist
 */

/**
 * @typedef {Object} RegistrationRequest
 * @property {string} eventId - Event ID
 * @property {string} eventName - Event name
 * @property {string} name - Registrant name
 * @property {string} email - Email address
 * @property {string} rollNo - Roll number
 * @property {string} department - Department
 * @property {string} utrId - Payment UTR ID
 * @property {number} amount - Payment amount
 * @property {File} [screenshot] - Payment screenshot
 */

/**
 * @typedef {Object} RegistrationResponse
 * @property {boolean} success
 * @property {string} [ticketId] - Generated ticket ID
 * @property {string} [message]
 * @property {string} [error]
 */

export { };
