import { createAdminClient } from '@/lib/supabase/server';

export const queueWelcomeEmail = async (email: string, name: string) => {
    try {
        const supabase = createAdminClient();
        await supabase.from('email_queue').insert([{
            type: 'WELCOME_EMAIL',
            payload: { email, name },
            status: 'PENDING'
        }]);
    } catch (error) {
        console.error("Error queuing welcome email:", error);
    }
};

export const queueTicketEmail = async (data: any) => {
    try {
        const supabase = createAdminClient();
        await supabase.from('email_queue').insert([{
            type: 'TICKET_EMAIL',
            payload: data,
            status: 'PENDING'
        }]);
    } catch (error) {
        console.error("Error queuing ticket email:", error);
    }
};
