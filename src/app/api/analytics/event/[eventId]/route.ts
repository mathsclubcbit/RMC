import { NextRequest, NextResponse } from 'next/server';
import { getAllRegistrations, RegistrationData } from '@/lib/google';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

        // Fetch event details from local JSON
        const eventsPath = path.join(process.cwd(), 'src/data/events.json');
        const eventsData = await fs.readFile(eventsPath, 'utf8');
        const events = JSON.parse(eventsData);
        const event = events.find((e: any) => e.id === eventId);

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Try to fetch registrations from Google Sheets
        let registrations: RegistrationData[] = [];
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (spreadsheetId && (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_SERVICE_ACCOUNT_JSON)) {
            try {
                const allRegistrations = await getAllRegistrations(spreadsheetId);
                registrations = allRegistrations.filter(r => r.eventId === eventId);
            } catch (googleError) {
                console.error('Google Sheets fetch failed for event analytics:', googleError);
            }
        }

        // Calculate event-specific metrics
        const totalRegistrations = registrations.length;
        const totalRevenue = registrations.reduce((sum, r) => sum + r.amount, 0);
        const pendingApprovals = registrations.filter(r => r.status === 'PENDING').length;
        const approvedCount = registrations.filter(r => r.status === 'APPROVED').length;
        const rejectedCount = registrations.filter(r => r.status === 'REJECTED').length;

        // Team statistics
        const teamRegistrations = registrations.filter(r => r.teamMembers && r.teamMembers.trim() !== '');
        const individualRegistrations = registrations.filter(r => !r.teamMembers || r.teamMembers.trim() === '');
        const totalTeams = teamRegistrations.length;

        // Calculate average team size (leader + team members)
        let totalTeamMembers = 0;
        teamRegistrations.forEach(r => {
            try {
                const members = JSON.parse(r.teamMembers || '[]');
                totalTeamMembers += 1 + members.length; // 1 for leader + team members
            } catch (e) {
                totalTeamMembers += 1; // Just the leader if parse fails
            }
        });
        const averageTeamSize = totalTeams > 0 ? (totalTeamMembers / totalTeams).toFixed(1) : 0;

        // Department distribution for this event
        const departmentDistribution: Record<string, number> = {};
        registrations.forEach(r => {
            const dept = r.department || 'Unknown';
            departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
        });

        // Daily registration trends for this event
        const trendsMap: Record<string, number> = {};
        registrations.forEach(r => {
            if (r.timestamp) {
                const date = r.timestamp.split('T')[0];
                trendsMap[date] = (trendsMap[date] || 0) + 1;
            }
        });

        const trends = Object.entries(trendsMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Status distribution
        const statusDistribution = {
            pending: pendingApprovals,
            approved: approvedCount,
            rejected: rejectedCount
        };

        return NextResponse.json({
            event: {
                id: event.id,
                title: event.title,
                date: event.date,
                status: event.status,
                category: event.category
            },
            overview: {
                totalRegistrations,
                totalRevenue,
                pendingApprovals,
                approvedCount,
                rejectedCount,
                approvalRate: totalRegistrations > 0 ? Math.round((approvedCount / totalRegistrations) * 100) : 0,
                totalTeams,
                individualRegistrations: individualRegistrations.length,
                averageTeamSize
            },
            departmentDistribution,
            statusDistribution,
            trends,
            registrations: registrations.map(r => {
                let teamSize = 1; // Default to individual
                let parsedTeamMembers = [];

                if (r.teamMembers && r.teamMembers.trim() !== '') {
                    try {
                        parsedTeamMembers = JSON.parse(r.teamMembers);
                        teamSize = 1 + parsedTeamMembers.length;
                    } catch (e) {
                        // Invalid JSON, treat as individual
                    }
                }

                return {
                    registrationId: r.registrationId,
                    name: r.name,
                    email: r.email,
                    rollNo: r.rollNo,
                    department: r.department,
                    amount: r.amount,
                    utrId: r.utrId,
                    status: r.status,
                    timestamp: r.timestamp,
                    driveViewUrl: r.driveViewUrl,
                    teamSize,
                    teamMembers: parsedTeamMembers
                };
            }),
            lastUpdated: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Event Analytics Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch event analytics' }, { status: 500 });
    }
}
