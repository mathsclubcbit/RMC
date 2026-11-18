import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Used for uptime monitoring and deployment verification
 */
export async function GET() {
    const healthCheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '0.1.0'
    };

    return NextResponse.json(healthCheck, { status: 200 });
}
