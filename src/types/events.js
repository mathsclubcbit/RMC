// Type definitions for Events
// These types are available for use throughout the application

/**
 * @typedef {Object} Event
 * @property {string} id - Unique event identifier
 * @property {string} name - Event name
 * @property {string} description - Event description
 * @property {string} date - Event start date (ISO string)
 * @property {string} [endDate] - Event end date (ISO string, optional)
 * @property {string} time - Event time
 * @property {string} venue - Event location
 * @property {string} [poster] - Poster image URL
 * @property {number} [price] - Registration price in INR
 * @property {{min: number, max: number}} [teamSize] - Team size constraints
 * @property {boolean} isArchived - Whether event is archived
 * @property {string} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} EventRegistration
 * @property {string} eventId - Event being registered for
 * @property {string} name - Registrant name
 * @property {string} email - Registrant email
 * @property {string} rollNo - Roll number
 * @property {string} department - Department name
 * @property {string} utrId - Payment UTR ID
 * @property {number} amount - Payment amount
 * @property {string[]} [teamMembers] - Team member names (for team events)
 */

/**
 * @typedef {'upcoming' | 'ongoing' | 'past'} EventStatus
 */

/**
 * @typedef {Object} EventFilters
 * @property {EventStatus} [status] - Filter by event status
 * @property {string} [search] - Search query
 * @property {string} [category] - Event category
 */

export { };
