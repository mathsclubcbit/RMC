// Server-only JWT utility module

import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => {
    const raw = process.env.JWT_SECRET;
    if (!raw) {
        throw new Error("CRITICAL: JWT_SECRET environment variable is not defined");
    }
    return new TextEncoder().encode(raw);
};

// Export for use in other server-side files
export { getSecret };

const secret = getSecret();

/**
 * Sign a JWT token with a payload
 * @param {object} payload - Claims to include (e.g., { type: 'admin' } or { type: 'coordinator', eventId })
 * @param {string} expiresIn - Expiration time (default: '24h')
 * @returns {Promise<string>} Signed JWT token
 */
export async function signToken(payload, expiresIn = '24h') {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secret);
}

/**
 * Verify a JWT token and return the payload
 * @param {string} token - JWT token to verify
 * @returns {Promise<object|null>} Decoded payload or null if invalid
 */
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        return null;
    }
}
