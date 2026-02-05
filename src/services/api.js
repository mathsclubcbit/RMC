/**
 * Base API client for making HTTP requests
 * Provides consistent error handling and response parsing
 */

/**
 * Make a fetch request with standard error handling
 * @param {string} url - API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function request(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || data.message || `Request failed with status ${response.status}`,
                status: response.status,
            };
        }

        return {
            success: true,
            data,
            status: response.status,
        };
    } catch (error) {
        console.error('API request error:', error);
        return {
            success: false,
            error: error.message || 'Network error occurred',
            status: 0,
        };
    }
}

/**
 * GET request helper
 * @param {string} url 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
function get(url) {
    return request(url, { method: 'GET' });
}

/**
 * POST request helper
 * @param {string} url 
 * @param {object} body 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
function post(url, body) {
    return request(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * PUT request helper
 * @param {string} url 
 * @param {object} body 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
function put(url, body) {
    return request(url, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

/**
 * DELETE request helper
 * @param {string} url 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
function del(url) {
    return request(url, { method: 'DELETE' });
}

/**
 * POST with FormData (for file uploads)
 * @param {string} url 
 * @param {FormData} formData 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function postFormData(url, formData) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header - browser will set it with boundary
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || data.message || `Request failed with status ${response.status}`,
                status: response.status,
            };
        }

        return {
            success: true,
            data,
            status: response.status,
        };
    } catch (error) {
        console.error('API FormData request error:', error);
        return {
            success: false,
            error: error.message || 'Network error occurred',
            status: 0,
        };
    }
}

export const api = {
    request,
    get,
    post,
    put,
    delete: del,
    postFormData,
};
