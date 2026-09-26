const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Updating ball types default timers...");
    await supabase.from('mpl_ball_types').update({ default_timer_seconds: 15 }).eq('slug', 'normal_1');
    await supabase.from('mpl_ball_types').update({ default_timer_seconds: 30 }).eq('slug', 'normal_2');
    await supabase.from('mpl_ball_types').update({ default_timer_seconds: 40 }).eq('slug', 'yorker');
    await supabase.from('mpl_ball_types').update({ default_timer_seconds: 40 }).eq('slug', 'full_toss');
    await supabase.from('mpl_ball_types').update({ default_timer_seconds: 50 }).eq('slug', 'normal_4');
    await supabase.from('mpl_ball_types').update({ default_timer_seconds: 60 }).eq('slug', 'normal_6');
    console.log("Ball types updated.");
    
    console.log("Updating existing questions in the database...");
    const { data: questions } = await supabase.from('mpl_questions').select('id, runs, ball_type_slug');
    
    let updated = 0;
    if (questions) {
        for (const q of questions) {
            let timer = 60;
            if (q.runs === 1) timer = 15;
            else if (q.runs === 2) timer = 30;
            else if (q.runs === 3) timer = 40;
            else if (q.runs === 4) timer = 50;
            else if (q.runs === 6) timer = 60;
            
            await supabase.from('mpl_questions').update({ timer_seconds: timer }).eq('id', q.id);
            updated++;
        }
    }
    console.log(`Updated ${updated} existing questions.`);
}
run();
