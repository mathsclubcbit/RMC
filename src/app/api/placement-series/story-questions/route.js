import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Public endpoint — no auth needed.
 * Returns today's daily questions with ORIGINAL (unshuffled) options.
 * Used by the Story Generator tool for the PR team.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");

        if (!eventId) {
            return NextResponse.json({ error: "eventId is required" }, { status: 400 });
        }

        const dateParam = searchParams.get("date");
        const queryDate =
            dateParam ||
            new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

        const admin = createAdminClient();

        const { data: dailyQuestions, error } = await admin
            .from("ps_daily_questions")
            .select(`
                id,
                question_number,
                question:ps_question_bank (
                    id, question_text, options, category, difficulty, correct_option
                )
            `)
            .eq("event_id", eventId)
            .eq("question_date", queryDate)
            .order("question_number", { ascending: true });

        if (error) throw error;

        const questions = (dailyQuestions || []).map((dq) => ({
            id: dq.id,
            questionNumber: dq.question_number,
            questionText: dq.question.question_text,
            options: dq.question.options,          // original order — no shuffle
            correctOption: dq.question.correct_option,
            category: dq.question.category,
            difficulty: dq.question.difficulty,
        }));

        return NextResponse.json({ date: queryDate, questions });
    } catch (err) {
        console.error("Story Generator API error:", err);
        return NextResponse.json(
            { error: "Failed to fetch questions" },
            { status: 500 }
        );
    }
}
