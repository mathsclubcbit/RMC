/**
 * Event service for event-related API calls
 */

import { api } from './api';
import { API_ENDPOINTS } from '@/constants';

/**
 * Fetch all events
 * @returns {Promise<{success: boolean, data?: Event[], error?: string}>}
 */
async function getAll() {
    return api.get(API_ENDPOINTS.EVENTS);
}

/**
 * Fetch a single event by ID
 * @param {string} eventId 
 * @returns {Promise<{success: boolean, data?: Event, error?: string}>}
 */
async function getById(eventId) {
    return api.get(API_ENDPOINTS.EVENT_BY_ID(eventId));
}

/**
 * Fetch upcoming events only
 * @returns {Promise<{success: boolean, data?: Event[], error?: string}>}
 */
async function getUpcoming() {
    const result = await getAll();
    if (!result.success) return result;

    const now = new Date();
    const upcoming = result.data.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && !event.isArchived;
    });

    return { success: true, data: upcoming };
}

/**
 * Fetch past events only
 * @returns {Promise<{success: boolean, data?: Event[], error?: string}>}
 */
async function getPast() {
    const result = await getAll();
    if (!result.success) return result;

    const now = new Date();
    const past = result.data.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < now || event.isArchived;
    });

    return { success: true, data: past };
}

export const eventService = {
    getAll,
    getById,
    getUpcoming,
    getPast,
};
