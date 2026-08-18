/**
 * Placement Series — Participant Auth Utilities
 *
 * Handles JWT signing/verification for ps_token (participant session).
 * Two tiers:
 *   isVerified: false — allowed for daily questions (email + roll no registered)
 *   isVerified: true  — allowed for contests (email OTP confirmed)
 */

import { SignJWT, jwtVerify } from 'jose';
import { getSecret } from '@/lib/jwt';

const PS_TOKEN_COOKIE = 'ps_token';
const PS_TOKEN_EXPIRY = '7d';

/**
 * Sign a participant JWT token.
 * @param {object} payload
 * @param {string} payload.participantId
 * @param {string} payload.eventId
 * @param {boolean} payload.isVerified
 * @returns {Promise<string>} signed JWT
 */
export async function signParticipantToken({ participantId, eventId, isVerified }) {
    return new SignJWT({ type: 'ps_participant', participantId, eventId, isVerified })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(PS_TOKEN_EXPIRY)
        .sign(getSecret());
}

/**
 * Verify a participant JWT token.
 * @param {string} token
 * @returns {Promise<{participantId: string, eventId: string, isVerified: boolean}|null>}
 */
export async function verifyParticipantToken(token) {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        if (payload?.type !== 'ps_participant') return null;
        return {
            participantId: payload.participantId,
            eventId: payload.eventId,
            isVerified: Boolean(payload.isVerified),
        };
    } catch {
        return null;
    }
}

/**
 * Verify a coordinator JWT token and confirm it owns the given eventId.
 * @param {string} token
 * @param {string} eventId
 * @returns {Promise<boolean>}
 */
export async function verifyCoordinatorToken(token, eventId) {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        if (payload?.type !== 'coordinator') return false;
        if (String(payload?.eventId) !== String(eventId)) return false;
        return true;
    } catch {
        return false;
    }
}

/**
 * Extract and verify participant from a Next.js request.
 *
 * @param {import('next/server').NextRequest} request
 * @param {boolean} requireVerified  — true for contest routes
 * @returns {Promise<
 *   {participantId: string, eventId: string, isVerified: boolean} |
 *   {error: 'unauthorized'} |
 *   {error: 'verification_required'}
 * >}
 */
export async function requireParticipant(request, requireVerified = false) {
    const token = request.cookies.get(PS_TOKEN_COOKIE)?.value;
    if (!token) return { error: 'unauthorized' };

    const participant = await verifyParticipantToken(token);
    if (!participant) return { error: 'unauthorized' };

    if (requireVerified && !participant.isVerified) {
        return { error: 'verification_required' };
    }

    return participant;
}

/**
 * Extract and verify coordinator from a Next.js request.
 * Checks that the coordinator token's eventId matches the provided eventId.
 *
 * @param {import('next/server').NextRequest} request
 * @param {string} eventId
 * @returns {Promise<{eventId: string} | null>}
 */
export async function requireCoordinator(request, eventId) {
    const token = request.cookies.get('coordinator_token')?.value;
    if (!token) return null;
    const ok = await verifyCoordinatorToken(token, eventId);
    if (!ok) return null;
    return { eventId };
}

/**
 * Set the ps_token cookie on a Next.js response.
 * @param {import('next/server').NextResponse} response
 * @param {string} token
 */
export function setParticipantCookie(response, token) {
    response.cookies.set(PS_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

/**
 * Generate a cryptographically-random 6-digit OTP string.
 * @returns {string} e.g. "482910"
 */
export function generateOtp() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(arr[0] % 1000000).padStart(6, '0');
}

/**
 * Shuffle an array using a deterministic seed (Fisher-Yates with LCG).
 * Same seed always produces same shuffle — used for option shuffling.
 * @param {Array} array
 * @param {string} seed — participantId + questionId concatenated
 * @returns {{ shuffled: Array, mapping: number[] }}
 *   mapping[i] = original index at shuffled position i
 */
export function deterministicShuffle(array, seed) {
    // Simple string-to-number hash (djb2)
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) + hash) + seed.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }

    const arr = array.map((item, i) => ({ item, i }));
    let h = Math.abs(hash);

    for (let i = arr.length - 1; i > 0; i--) {
        h = (h * 1664525 + 1013904223) & 0xffffffff; // LCG
        const j = Math.abs(h) % (i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return {
        shuffled: arr.map(x => x.item),
        mapping: arr.map(x => x.i), // mapping[shuffled_idx] = original_idx
    };
}

/**
 * Given the shuffled index that the user selected, find the original (canonical) index.
 * @param {number[]} mapping — from deterministicShuffle
 * @param {number} shuffledIndex — what the user clicked
 * @returns {number} original index
 */
export function unshuffleOption(mapping, shuffledIndex) {
    return mapping[shuffledIndex];
}

export { PS_TOKEN_COOKIE };
