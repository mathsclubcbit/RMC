"use server";

import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-replace-in-production');

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
