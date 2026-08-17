"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Loader2, Download, RefreshCw, ChevronLeft, ChevronRight,
    Check, Copy
} from "lucide-react";

// Helper to wrap text into multiple lines
function wrapText(ctx, text, maxWidth) {
    if (!text) return [];
    const paragraphs = text.split("\n");
    const allLines = [];

    paragraphs.forEach((paragraph) => {
        const words = paragraph.split(" ");
        let currentLine = "";

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (!word) continue;
            const testLine = currentLine ? currentLine + " " + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine.length > 0) {
                allLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            allLines.push(currentLine);
        }
    });
    return allLines;
}

export default function StoryClient({ eventId }) {
    const [date, setDate] = useState("");
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [downloadDone, setDownloadDone] = useState(false);
    const [copiedDone, setCopiedDone] = useState(false);

    // Custom editable question state
    const [customQuestionText, setCustomQuestionText] = useState(
        "Statements: 1. All programmers are logical.\n2. Some logical people are mathematicians.\n3. No mathematician is careless.\nWhat follows?"
    );
    const [customOptions, setCustomOptions] = useState([
        "Only I follows",
        "I and II follows",
        "Only II follows",
        "None follows"
    ]);
    const [footerText, setFooterText] = useState("Link in story to submit your answer");
    const [showFooter, setShowFooter] = useState(true);

    const canvasRef = useRef(null);
    const templateImgRef = useRef(null);

    // Initialize with today's date in IST
    useEffect(() => {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        setDate(today);
    }, []);

    // Draw to Canvas
    const drawToCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = 1080;
        const H = 1920;

        // Base Background
        if (templateImgRef.current && templateImgRef.current.complete && templateImgRef.current.naturalWidth > 0) {
            ctx.drawImage(templateImgRef.current, 0, 0, W, H);
        } else {
            ctx.fillStyle = "#363D46";
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = "#F4F4F2";
            ctx.font = "700 52px 'Cinzel', serif";
            ctx.textAlign = "center";
            ctx.fillText("Ramanujan Math Club", 540, 140);
            ctx.font = "700 20px 'Cinzel', serif";
            ctx.fillText("P R E S E N T S", 540, 190);
            ctx.font = "80px 'Rye', serif";
            ctx.fillText("PLACEMENT SERIES 4.0", 540, 390);
        }

        // Question text
        const qText = customQuestionText || (questions[currentIdx] ? questions[currentIdx].questionText : "");

        if (qText) {
            ctx.save();
            const maxQWidth = 710;
            const maxQHeight = 360;
            let qFontSize = 46;

            for (let size = 52; size >= 24; size -= 2) {
                ctx.font = `800 ${size}px 'Outfit', 'Plus Jakarta Sans', -apple-system, sans-serif`;
                const testLines = wrapText(ctx, qText, maxQWidth);
                const testLineHeight = size * 1.34;
                if (testLines.length * testLineHeight <= maxQHeight) {
                    qFontSize = size;
                    break;
                }
            }

            ctx.font = `800 ${qFontSize}px 'Outfit', 'Plus Jakarta Sans', -apple-system, sans-serif`;
            ctx.fillStyle = "#0D1117";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const qLines = wrapText(ctx, qText, maxQWidth);
            const qLineHeight = qFontSize * 1.34;
            const totalTextHeight = qLines.length * qLineHeight;
            let startY = 794 + (413 - totalTextHeight) / 2 + qLineHeight / 2;

            qLines.forEach((line) => {
                ctx.fillText(line, 539, startY);
                startY += qLineHeight;
            });
            ctx.restore();
        }

        // 4 Option Boxes
        const currentOptions = customOptions[0] ? customOptions : (questions[currentIdx] ? questions[currentIdx].options : ["A", "B", "C", "D"]);
        const optionCoords = [
            { x: 107, y: 1432, letter: "A" },
            { x: 566, y: 1432, letter: "B" },
            { x: 107, y: 1626, letter: "C" },
            { x: 566, y: 1626, letter: "D" }
        ];

        optionCoords.forEach(({ x, y, letter }, i) => {
            const optVal = currentOptions[i] || `Option ${letter}`;

            ctx.save();
            // Circular Badge (52px diameter)
            ctx.fillStyle = "#12161E";
            ctx.beginPath();
            ctx.arc(x + 44, y + 50, 26, 0, Math.PI * 2);
            ctx.fill();

            // Letter
            ctx.font = "800 26px 'Outfit', sans-serif";
            ctx.fillStyle = "#F9FAFB";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(letter, x + 44, y + 51);

            // Option Text
            let optFontSize = 38;
            const maxOptWidth = 310;

            for (let size = 38; size >= 20; size -= 2) {
                ctx.font = `800 ${size}px 'Outfit', 'Plus Jakarta Sans', sans-serif`;
                const testLines = wrapText(ctx, optVal, maxOptWidth);
                if (testLines.length <= 2) {
                    optFontSize = size;
                    break;
                }
            }

            ctx.font = `800 ${optFontSize}px 'Outfit', 'Plus Jakarta Sans', sans-serif`;
            ctx.fillStyle = "#0D1117";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";

            const optLines = wrapText(ctx, optVal, maxOptWidth);
            if (optLines.length === 1) {
                ctx.fillText(optLines[0], x + 82, y + 51);
            } else {
                const optLineHeight = optFontSize * 1.22;
                ctx.fillText(optLines[0], x + 82, y + 50 - optLineHeight / 2 + 2);
                ctx.fillText(optLines[1] || "", x + 82, y + 50 + optLineHeight / 2 + 2);
            }
            ctx.restore();
        });

        // Bottom Footer Banner
        if (showFooter && footerText.trim()) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillStyle = "rgba(18, 22, 30, 0.48)";
            const bannerWidth = 840;
            const bannerHeight = 64;
            const bannerX = (W - bannerWidth) / 2;
            const bannerY = 1780;

            ctx.beginPath();
            ctx.moveTo(bannerX + 32, bannerY);
            ctx.lineTo(bannerX + bannerWidth - 32, bannerY);
            ctx.quadraticCurveTo(bannerX + bannerWidth, bannerY, bannerX + bannerWidth, bannerY + 32);
            ctx.quadraticCurveTo(bannerX + bannerWidth, bannerY + bannerHeight, bannerX + bannerWidth - 32, bannerY + bannerHeight);
            ctx.lineTo(bannerX + 32, bannerY + bannerHeight);
            ctx.quadraticCurveTo(bannerX, bannerY + bannerHeight, bannerX, bannerY + 32);
            ctx.quadraticCurveTo(bannerX, bannerY, bannerX + 32, bannerY);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = "700 24px 'Outfit', sans-serif";
            ctx.fillStyle = "#F3F4F6";
            ctx.fillText(footerText, 540, bannerY + 33);
            ctx.restore();
        }

    }, [customQuestionText, customOptions, questions, currentIdx, footerText, showFooter]);

    // Load template image safely
    useEffect(() => {
        const img = new Image();
        img.src = "/story-template.png";
        img.onload = () => {
            templateImgRef.current = img;
            drawToCanvas();
        };
        drawToCanvas();
    }, [drawToCanvas]);

    // Re-draw when fonts or state change
    useEffect(() => {
        if (document.fonts) {
            document.fonts.ready.then(() => drawToCanvas());
        } else {
            drawToCanvas();
        }
    }, [drawToCanvas]);

    // Fetch Questions
    const fetchQuestions = useCallback(async (targetDate) => {
        const qDate = targetDate || date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        if (!eventId) return;

        setLoading(true);
        setError("");
        setCurrentIdx(0);

        try {
            const res = await fetch(`/api/placement-series/story-questions?eventId=${encodeURIComponent(eventId)}&date=${qDate}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to fetch questions");

            if (!data.questions || data.questions.length === 0) {
                setError("No questions assigned for this date yet.");
                setQuestions([]);
            } else {
                setQuestions(data.questions);
                const firstQ = data.questions[0];
                setCustomQuestionText(firstQ.questionText);
                setCustomOptions([...firstQ.options]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eventId, date]);

    useEffect(() => {
        if (date && eventId) {
            fetchQuestions(date);
        }
    }, [date, eventId, fetchQuestions]);

    // When question index changes
    useEffect(() => {
        if (questions.length > 0 && questions[currentIdx]) {
            const q = questions[currentIdx];
            setCustomQuestionText(q.questionText);
            setCustomOptions([...q.options]);
        }
    }, [currentIdx, questions]);

    // Download PNG
    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setDownloadDone(true);
        const link = document.createElement("a");
        const qNum = currentIdx + 1;
        link.download = `RMC-PlacementSeries-${date || 'story'}-Q${qNum}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        setTimeout(() => setDownloadDone(false), 2500);
    };

    // Copy Image
    const handleCopyImage = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob })
                ]);
                setCopiedDone(true);
                setTimeout(() => setCopiedDone(false), 2500);
            });
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Google Fonts */}
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Creepster&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800&family=Rye&display=swap"
            />

            <div className="max-w-6xl mx-auto px-4 py-8">
                
                {/* ── Minimal Header ───────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                            Story Generator
                        </h1>
                        <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                            Placement Series 4.0 · 1080 × 1920 Instagram Story
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                        />
                        <button
                            onClick={() => fetchQuestions(date)}
                            disabled={loading}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-400" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* ── Question Selector Tabs ───────────────────────────── */}
                {questions.length > 0 && (
                    <div className="flex items-center gap-2 mb-6">
                        {questions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIdx(idx)}
                                className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                    currentIdx === idx
                                        ? "bg-teal-400 text-black font-semibold"
                                        : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                }`}
                            >
                                Question {idx + 1}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                        {error}
                    </div>
                )}

                {/* ── Workspace: Left Editor, Right Preview ────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    
                    {/* Left: Clean Minimal Editor */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 sm:p-5">
                            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                                Edit Question &amp; Options
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-white/40 uppercase mb-1">
                                        Question Text
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={customQuestionText}
                                        onChange={(e) => setCustomQuestionText(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs sm:text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-teal-400 transition-colors resize-none"
                                        placeholder="Question text..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                        <div key={idx}>
                                            <label className="block text-[10px] font-medium text-white/40 uppercase mb-0.5">
                                                Option {letter}
                                            </label>
                                            <input
                                                type="text"
                                                value={customOptions[idx] || ""}
                                                onChange={(e) => {
                                                    const updated = [...customOptions];
                                                    updated[idx] = e.target.value;
                                                    setCustomOptions(updated);
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-teal-400"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] font-medium text-white/40 uppercase">
                                            Bottom Text Banner
                                        </label>
                                        <label className="text-[11px] text-teal-400 cursor-pointer flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={showFooter}
                                                onChange={(e) => setShowFooter(e.target.checked)}
                                                className="accent-teal-400 rounded"
                                            />
                                            Show
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        value={footerText}
                                        onChange={(e) => setFooterText(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-teal-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleDownload}
                                className="flex-1 py-2.5 px-4 rounded-lg bg-teal-400 hover:bg-teal-300 text-black font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {downloadDone ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Downloaded!</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span>Download Story PNG (1080×1920)</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleCopyImage}
                                className="py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                            >
                                {copiedDone ? (
                                    <>
                                        <Check className="w-4 h-4 text-teal-400" />
                                        <span className="text-teal-300">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 text-white/50" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right: Clean Canvas Preview */}
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-[380px]">
                            {/* Pagination indicator */}
                            <div className="flex items-center justify-between mb-2 text-xs text-white/40">
                                <span>Preview (1080 × 1920)</span>
                                {questions.length > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                                            disabled={currentIdx === 0}
                                            className="p-1 rounded hover:bg-white/10 disabled:opacity-20"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <span>{currentIdx + 1} / {questions.length}</span>
                                        <button
                                            onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                                            disabled={currentIdx === questions.length - 1}
                                            className="p-1 rounded hover:bg-white/10 disabled:opacity-20"
                                        >
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Clean Bordered Canvas Wrapper */}
                            <div className="w-full aspect-[9/16] rounded-xl overflow-hidden border border-white/10 bg-[#363D46] shadow-xl">
                                <canvas
                                    ref={canvasRef}
                                    width={1080}
                                    height={1920}
                                    className="w-full h-full object-contain block"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
