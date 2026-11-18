import { NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

export async function POST(request) {
    try {
        const { teamName, password } = await request.json();

        if (!teamName || !password) {
            return NextResponse.json({ error: 'Team name and password are required' }, { status: 400 });
        }

        // Map team name to env var suffix
        const envKey = `TEAM_PASS_${teamName.toUpperCase().replace(/[^A-Z]/g, '')}`;
        const correctPassword = process.env[envKey];

        if (!correctPassword || password !== correctPassword) {
            return NextResponse.json({ error: 'Invalid team or password' }, { status: 401 });
        }

        // Generate JWT token for team head
        const token = await signToken({ type: 'team', team: teamName }, '7d');

        // Create response with cookie
        const response = NextResponse.json({ success: true, team: teamName });
        
        response.cookies.set({
            name: 'team_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error) {
        console.error('Team Login Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
