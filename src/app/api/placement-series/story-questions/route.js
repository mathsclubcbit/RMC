import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Public endpoint for Story Generator
 * Returns daily questions with ORIGINAL options, correct_option, tags, and explanation.
 * If no questions on the given date, finds the latest previous date's questions.
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

        let { data: dailyQuestions, error } = await admin
            .from("ps_daily_questions")
            .select(`
                id,
                question_number,
                question_date,
                question:ps_question_bank (
                    id, question_text, options, category, difficulty, correct_option, explanation, tags
                )
            `)
            .eq("event_id", eventId)
            .eq("question_date", queryDate)
            .order("question_number", { ascending: true });

        if (error) throw error;

        let isPreviousDayFallback = false;
        let sourceDate = queryDate;

        // Fallback to previous day if no questions on queryDate
        if (!dailyQuestions || dailyQuestions.length === 0) {
            const { data: prevQuestions } = await admin
                .from("ps_daily_questions")
                .select(`
                    id,
                    question_number,
                    question_date,
                    question:ps_question_bank (
                        id, question_text, options, category, difficulty, correct_option, explanation, tags
                    )
                `)
                .eq("event_id", eventId)
                .lt("question_date", queryDate)
                .order("question_date", { ascending: false })
                .order("question_number", { ascending: true })
                .limit(3);

            if (prevQuestions && prevQuestions.length > 0) {
                sourceDate = prevQuestions[0].question_date;
                dailyQuestions = prevQuestions.filter(d => d.question_date === sourceDate);
                isPreviousDayFallback = true;
            }
        }

        const questions = (dailyQuestions || []).map((dq) => ({
            id: dq.id,
            questionNumber: dq.question_number,
            questionText: dq.question?.question_text || "",
            options: dq.question?.options || ["A", "B", "C", "D"],
            correctOption: dq.question?.correct_option ?? 0,
            explanation: dq.question?.explanation || "",
            category: dq.question?.category || "Aptitude",
            difficulty: dq.question?.difficulty || "medium",
            tags: dq.question?.tags || [],
        }));

        return NextResponse.json({ 
            date: queryDate, 
            sourceDate, 
            isPreviousDayFallback, 
            questions 
        });
    } catch (err) {
        console.error("Story Generator API error:", err);
        return NextResponse.json(
            { error: "Failed to fetch questions" },
            { status: 500 }
        );
    }
}
