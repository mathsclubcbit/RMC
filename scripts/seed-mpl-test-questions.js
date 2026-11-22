require('dotenv').config({ path: '.env.local' });
const { randomInt } = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const TEST_SEED = 'basic-arithmetic-test-v1';
const QUESTION_COUNT = 100;
const BALL_TYPES = ['normal_1', 'normal_2', 'normal_4', 'normal_6', 'bouncer', 'yorker', 'full_toss'];

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function createArithmeticQuestion(index) {
    const operation = ['addition', 'subtraction', 'multiplication', 'division'][index % 4];
    let questionText;
    let answer;

    if (operation === 'addition') {
        const first = randomInt(10, 500);
        const second = randomInt(10, 500);
        questionText = `What is ${first} + ${second}?`;
        answer = first + second;
    } else if (operation === 'subtraction') {
        const first = randomInt(100, 800);
        const second = randomInt(10, first);
        questionText = `What is ${first} - ${second}?`;
        answer = first - second;
    } else if (operation === 'multiplication') {
        const first = randomInt(2, 30);
        const second = randomInt(2, 30);
        questionText = `What is ${first} x ${second}?`;
        answer = first * second;
    } else {
        const divisor = randomInt(2, 20);
        const quotient = randomInt(2, 30);
        const dividend = divisor * quotient;
        questionText = `What is ${dividend} / ${divisor}?`;
        answer = quotient;
    }

    const offsets = [-7, -3, 4, 9];
    const correctOption = index % 4;
    const options = offsets.map((offset, optionIndex) => String(optionIndex === correctOption ? answer : Math.max(0, answer + offset)));

    return {
        question_text: questionText,
        options,
        correct_option: correctOption,
        explanation: `The correct answer is ${answer}.`,
        metadata: { seed: TEST_SEED, operation, generated_index: index },
        is_active: true
    };
}

async function seedQuestions() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    }

    const { data: ballTypes, error: ballTypeError } = await supabase
        .from('mpl_ball_types')
        .select('slug')
        .in('slug', BALL_TYPES);
    if (ballTypeError) throw ballTypeError;
    if ((ballTypes || []).length !== BALL_TYPES.length) {
        throw new Error('The MPL ball types are missing. Apply 020_mpl_match_engine.sql first.');
    }

    const { error: cleanupError } = await supabase
        .from('mpl_questions')
        .delete()
        .contains('metadata', { seed: TEST_SEED });
    if (cleanupError) throw cleanupError;

    const questions = Array.from({ length: QUESTION_COUNT }, (_, index) => ({
        ball_type_slug: BALL_TYPES[index % BALL_TYPES.length],
        ...createArithmeticQuestion(index)
    }));

    const { error: insertError } = await supabase.from('mpl_questions').insert(questions);
    if (insertError) throw insertError;

    const distribution = questions.reduce((counts, question) => {
        counts[question.ball_type_slug] = (counts[question.ball_type_slug] || 0) + 1;
        return counts;
    }, {});

    console.log(`Inserted ${questions.length} MPL test questions.`);
    console.table(distribution);
}

seedQuestions().catch((error) => {
    console.error('Failed to seed MPL test questions:', error.message || error);
    process.exitCode = 1;
});
