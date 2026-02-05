import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 * @param  {...any} inputs - Class names to merge
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 * @param {string | Date} date - Date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted date string
 * 
 * @example
 * formatDate('2024-01-15') // "15 January 2024"
 */
export function formatDate(date, options = {}) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        ...options,
    }).format(new Date(date));
}

/**
 * Format a date with time
 * @param {string | Date} date 
 * @returns {string}
 * 
 * @example
 * formatDateTime('2024-01-15T14:30:00') // "15 January 2024, 2:30 PM"
 */
export function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(date));
}

/**
 * Format currency in INR
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1500) // "₹1,500"
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Convert text to URL-safe slug
 * @param {string} text - Text to slugify
 * @returns {string} URL-safe slug
 * 
 * @example
 * slugify('Hello World!') // "hello-world"
 */
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {string} Truncated text
 * 
 * @example
 * truncate('Very long text...', 20) // "Very long text..."
 */
export function truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter of each word
 * @param {string} text 
 * @returns {string}
 * 
 * @example
 * capitalize('hello world') // "Hello World"
 */
export function capitalize(text) {
    return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Delay execution for a given time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 * 
 * @example
 * await sleep(1000); // Wait 1 second
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a date is in the past
 * @param {string | Date} date 
 * @returns {boolean}
 */
export function isPastDate(date) {
    return new Date(date) < new Date();
}

/**
 * Check if a date is today
 * @param {string | Date} date 
 * @returns {boolean}
 */
export function isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return (
        checkDate.getDate() === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear()
    );
}

/**
 * Generate a random ID
 * @param {number} length - Length of ID (default: 8)
 * @returns {string}
 */
export function generateId(length = 8) {
    return Math.random()
        .toString(36)
        .substring(2, 2 + length);
}
