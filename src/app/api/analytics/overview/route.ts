import { NextResponse } from 'next/server';
import { getAllRegistrations, RegistrationData } from '@/lib/google';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Fetch events from local JSON (always available)
        const eventsPath = path.join(process.cwd(), 'src/data/events.json');
        const eventsData = await fs.readFile(eventsPath, 'utf8');
        const events = JSON.parse(eventsData);

        // Try to fetch registrations from Google Sheets
        let registrations: RegistrationData[] = [];
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (spreadsheetId && (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_SERVICE_ACCOUNT_JSON)) {
            try {
                registrations = await getAllRegistrations(spreadsheetId);
            } catch (googleError) {
                console.error('Google Sheets fetch failed, using empty registrations:', googleError);
                // Continue with empty registrations
            }
        }

        // Calculate overview metrics
        const totalEvents = events.length;
        const activeEvents = events.filter((e: any) => e.status === 'Registration Open').length;
        const completedEvents = events.filter((e: any) => e.status === 'Completed').length;
        const totalRegistrations = registrations.length;
        const totalRevenue = registrations.reduce((sum, r) => sum + r.amount, 0);
        const pendingApprovals = registrations.filter(r => r.status === 'PENDING').length;
        const approvedCount = registrations.filter(r => r.status === 'APPROVED').length;
        const rejectedCount = registrations.filter(r => r.status === 'REJECTED').length;

        // Team statistics across all events
        const teamRegistrations = registrations.filter(r => r.teamMembers && r.teamMembers.trim() !== '');
        const individualRegistrations = registrations.filter(r => !r.teamMembers || r.teamMembers.trim() === '');
        const totalTeams = teamRegistrations.length;

        // Calculate average team size
        let totalTeamMembers = 0;
        teamRegistrations.forEach(r => {
            try {
                const members = JSON.parse(r.teamMembers || '[]');
                totalTeamMembers += 1 + members.length;
            } catch (e) {
                totalTeamMembers += 1;
            }
        });
        const averageTeamSize = totalTeams > 0 ? (totalTeamMembers / totalTeams).toFixed(1) : 0;

        // Registrations per event
        const eventStats = events.map((event: any) => {
            const eventRegistrations = registrations.filter(r => r.eventId === event.id);
            return {
                id: event.id,
                title: event.title,
                category: event.category || 'Other',
                registrations: eventRegistrations.length,
                revenue: eventRegistrations.reduce((sum, r) => sum + r.amount, 0),
                pending: eventRegistrations.filter(r => r.status === 'PENDING').length,
                approved: eventRegistrations.filter(r => r.status === 'APPROVED').length
            };
        });

        // Sort by registrations descending for top events
        const topEvents = [...eventStats]
            .sort((a, b) => b.registrations - a.registrations)
            .slice(0, 5);

        // Category distribution (registrations per category)
        const categoryDistribution: Record<string, number> = {};
        events.forEach((event: any) => {
            const cat = event.category || 'Other';
            const eventRegs = registrations.filter(r => r.eventId === event.id).length;
            categoryDistribution[cat] = (categoryDistribution[cat] || 0) + eventRegs;
        });

        // If no registrations, still show categories from events
        if (registrations.length === 0) {
            events.forEach((event: any) => {
                const cat = event.category || 'Other';
                categoryDistribution[cat] = (categoryDistribution[cat] || 0);
            });
        }

        // Department distribution
        const departmentDistribution: Record<string, number> = {};
        registrations.forEach(r => {
            const dept = r.department || 'Unknown';
            departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
        });

        // Daily registration trends (sorted by date)
        const trendsMap: Record<string, number> = {};
        registrations.forEach(r => {
            if (r.timestamp) {
                const date = r.timestamp.split('T')[0]; // YYYY-MM-DD
                trendsMap[date] = (trendsMap[date] || 0) + 1;
            }
        });

        // Convert to sorted array for charts
        const trends = Object.entries(trendsMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Revenue trends
        const revenueTrendsMap: Record<string, number> = {};
        registrations.forEach(r => {
            if (r.timestamp) {
                const date = r.timestamp.split('T')[0];
                revenueTrendsMap[date] = (revenueTrendsMap[date] || 0) + r.amount;
            }
        });

        const revenueTrends = Object.entries(revenueTrendsMap)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            overview: {
                totalEvents,
                activeEvents,
                completedEvents,
                totalRegistrations,
                totalRevenue,
                pendingApprovals,
                approvedCount,
                rejectedCount,
                totalTeams,
                individualRegistrations: individualRegistrations.length,
                averageTeamSize
            },
            eventStats,
            topEvents,
            categoryDistribution,
            departmentDistribution,
            trends,
            revenueTrends,
            lastUpdated: new Date().toISOString(),
            dataSource: registrations.length > 0 ? 'google_sheets' : 'events_only'
        });
    } catch (error: any) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
    }
}
