import { describe, it, expect } from 'vitest';

describe('Health Check API', () => {
    it('should return 200 with status ok', async () => {
        // Import the route handler
        const { GET } = await import('@/app/api/health/route');

        // Call the handler
        const response = await GET();
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.status).toBe('ok');
        expect(data.timestamp).toBeDefined();
        expect(data.environment).toBeDefined();
    });
});

describe('Basic Utilities', () => {
    it('should correctly validate email format', () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        expect(emailRegex.test('test@example.com')).toBe(true);
        expect(emailRegex.test('invalid-email')).toBe(false);
        expect(emailRegex.test('test@')).toBe(false);
    });

    it('should correctly validate phone number format', () => {
        const phoneRegex = /^[0-9]{10}$/;

        expect(phoneRegex.test('9876543210')).toBe(true);
        expect(phoneRegex.test('123')).toBe(false);
        expect(phoneRegex.test('12345678901')).toBe(false);
    });
});
