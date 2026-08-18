"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Loader2, Download, RefreshCw, ChevronLeft, ChevronRight,
    Check, Copy, Lightbulb, HelpCircle, FileText, Building2
} from "lucide-react";

// ── Company logo lookup ──────────────────────────────────────────────────────
// Maps lowercased company name/tag -> key used in /api/proxy-logo?company=KEY
// Keys must match LOCAL_LOGO_MAP in the proxy route
const COMPANY_KEY_MAP = {
    tcs:             'tcs',
    'tata':          'tcs',
    wipro:           'wipro',
    infosys:         'infosys',
    cognizant:       'cognizant',
    hcl:             'hcl',
    'hcl tech':      'hcl',
    hcltech:         'hcl',
    google:          'google',
    microsoft:       'microsoft',
    amazon:          'amazon',
    ibm:             'ibm',
    salesforce:      'salesforce',
    deloitte:        'deloitte',
    goldman:         'goldman',
    'goldman sachs': 'goldman',
    wipro:           'wipro',
};

function getCompanyKey(tags = [], category = '') {
    const candidates = [
        ...tags.filter(t => !String(t).startsWith('q_no:')).map(t => String(t).toLowerCase()),
        String(category).toLowerCase()
    ];
    for (const c of candidates) {
        if (COMPANY_KEY_MAP[c]) return COMPANY_KEY_MAP[c];
        // Partial match
        for (const [key, logoKey] of Object.entries(COMPANY_KEY_MAP)) {
            if (c.includes(key) || key.includes(c)) return logoKey;
        }
    }
    return null;
}

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

    // Story Mode: 'question' or 'explanation'
    const [storyMode, setStoryMode] = useState("question");

    // Custom editable question state
    const [customQuestionText, setCustomQuestionText] = useState(
        "In a 100 m race, A beats B by either 10 m or 2 seconds. Find A's speed."
    );
    const [customOptions, setCustomOptions] = useState([
        "50/9 m/s",
        "5 m/s",
        "6 m/s",
        "45/8 m/s"
    ]);
    const [customCorrectOption, setCustomCorrectOption] = useState(0);
    const [customExplanation, setCustomExplanation] = useState(
        "Since A beats B by 10 m or 2 sec, B covers 10 m in 2 sec, so B's speed = 5 m/s.\nTime taken by B to run 100 m = 100/5 = 20 sec.\nTime taken by A = 20 - 2 = 18 sec.\nTherefore, A's speed = 100/18 = 50/9 m/s."
    );

    const [footerText, setFooterText] = useState("Link in story to solve & submit");
    const [showFooter, setShowFooter] = useState(true);

    // Company logo
    const [companyLogo, setCompanyLogo] = useState(null);   // domain string or null
    const [showCompanyLogo, setShowCompanyLogo] = useState(true);
    const logoImgRef = useRef(null);
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

        // 1. Base Background & Template
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

        // 2. Question text in designated box (Y: 794 - 1207)
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

        // 3. Lower Area: Question Mode (4 Options) vs Explanation Mode (Full Solution Card)
        if (storyMode === "question") {
            // ── 4 Option Boxes ──
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
        } else {
            // ── EXPLANATION / SOLUTION MODE ──
            // Remove options entirely and render a dedicated explanation card
            const correctLetter = String.fromCharCode(65 + (customCorrectOption >= 0 ? customCorrectOption : 0));
            const explText = customExplanation.trim() || "No explanation provided for this question.";

            ctx.save();
            const cardX = 95;
            const cardY = 1380;
            const cardWidth = 890;
            const cardHeight = 350;
            const radius = 28;

            // Frosted Background Card
            ctx.fillStyle = "#111622";
            ctx.beginPath();
            ctx.moveTo(cardX + radius, cardY);
            ctx.lineTo(cardX + cardWidth - radius, cardY);
            ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + radius);
            ctx.lineTo(cardX + cardWidth, cardY + cardHeight - radius);
            ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - radius, cardY + cardHeight);
            ctx.lineTo(cardX + radius, cardY + cardHeight);
            ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - radius);
            ctx.lineTo(cardX, cardY + radius);
            ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
            ctx.closePath();
            ctx.fill();

            // Border
            ctx.strokeStyle = "rgba(45, 212, 191, 0.4)";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Correct Answer Tag Pill
            const tagX = cardX + 32;
            const tagY = cardY + 28;
            const tagW = 340;
            const tagH = 46;

            ctx.fillStyle = "rgba(45, 212, 191, 0.15)";
            ctx.beginPath();
            ctx.roundRect(tagX, tagY, tagW, tagH, 12);
            ctx.fill();
            ctx.strokeStyle = "rgba(45, 212, 191, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = "800 20px 'Outfit', sans-serif";
            ctx.fillStyle = "#2DD4BF";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(`✓ CORRECT OPTION: (${correctLetter})`, tagX + 16, tagY + tagH / 2 + 1);

            // Explanation Header
            ctx.font = "800 20px 'Outfit', sans-serif";
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.textAlign = "right";
            ctx.fillText("SOLUTION & EXPLANATION", cardX + cardWidth - 32, tagY + tagH / 2 + 1);

            // Solution Text Wrapping & Auto-scaling
            const maxExplWidth = cardWidth - 64;
            const maxExplHeight = cardHeight - 110;
            let explFontSize = 30;

            for (let size = 32; size >= 18; size -= 2) {
                ctx.font = `600 ${size}px 'Outfit', 'Plus Jakarta Sans', sans-serif`;
                const testLines = wrapText(ctx, explText, maxExplWidth);
                const testLineHeight = size * 1.35;
                if (testLines.length * testLineHeight <= maxExplHeight) {
                    explFontSize = size;
                    break;
                }
            }

            ctx.font = `600 ${explFontSize}px 'Outfit', 'Plus Jakarta Sans', sans-serif`;
            ctx.fillStyle = "#F3F4F6";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";

            const explLines = wrapText(ctx, explText, maxExplWidth);
            const explLineHeight = explFontSize * 1.38;
            let textY = cardY + 95;

            explLines.forEach((line) => {
                ctx.fillText(line, cardX + 32, textY);
                textY += explLineHeight;
            });

            ctx.restore();
        }

        // 4. Bottom Footer Banner
        if (showFooter && footerText.trim()) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillStyle = "rgba(18, 22, 30, 0.65)";
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

        // 5. Company Logo – bottom-right corner badge
        if (showCompanyLogo && logoImgRef.current && logoImgRef.current.complete && logoImgRef.current.naturalWidth > 0) {
            const logo = logoImgRef.current;
            const badgeW = 320;
            const badgeH = 110;
            const badgeX = W - badgeW - 48;
            const badgeY = H - badgeH - (showFooter && footerText.trim() ? 130 : 48);
            const radius = 28;

            ctx.save();
            // Frosted pill background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius);
            ctx.fill();

            // Fit logo inside badge with padding
            const pad = 18;
            const availW = badgeW - pad * 2;
            const availH = badgeH - pad * 2;
            const scale = Math.min(availW / logo.naturalWidth, availH / logo.naturalHeight);
            const drawW = logo.naturalWidth * scale;
            const drawH = logo.naturalHeight * scale;
            const drawX = badgeX + pad + (availW - drawW) / 2;
            const drawY = badgeY + pad + (availH - drawH) / 2;

            ctx.drawImage(logo, drawX, drawY, drawW, drawH);
            ctx.restore();
        }

    }, [customQuestionText, customOptions, customCorrectOption, customExplanation, storyMode, questions, currentIdx, footerText, showFooter, showCompanyLogo]);

    // Load template image
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
                setCustomCorrectOption(firstQ.correctOption ?? 0);
                setCustomExplanation(firstQ.explanation || "");
                // Detect logo for the first question
                setCompanyLogo(getCompanyKey(firstQ.tags || [], firstQ.category || ''));
                if (data.isPreviousDayFallback) {
                    setError(`Showing questions from ${data.sourceDate} (Review / Solution Day).`);
                }
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

    // When question index changes — also update company logo
    useEffect(() => {
        if (questions.length > 0 && questions[currentIdx]) {
            const q = questions[currentIdx];
            setCustomQuestionText(q.questionText);
            setCustomOptions([...q.options]);
            setCustomCorrectOption(q.correctOption ?? 0);
            setCustomExplanation(q.explanation || "");

            // Resolve logo
            const domain = getCompanyKey(q.tags || [], q.category || '');
            setCompanyLogo(domain);
        }
    }, [currentIdx, questions]);

    // Load company logo image whenever companyLogo domain changes
    useEffect(() => {
        if (!companyLogo || !showCompanyLogo) {
            logoImgRef.current = null;
            drawToCanvas();
            return;
        }
        const img = new Image();
        // Use our proxy route serving local logos (no CORS issues)
        img.src = `/api/proxy-logo?company=${encodeURIComponent(companyLogo)}`;
        img.onload = () => {
            logoImgRef.current = img;
            drawToCanvas();
        };
        img.onerror = () => {
            logoImgRef.current = null;
            drawToCanvas();
        };
    }, [companyLogo, showCompanyLogo, drawToCanvas]);

    // Download PNG
    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setDownloadDone(true);
        const link = document.createElement("a");
        const qNum = currentIdx + 1;
        const modeLabel = storyMode === 'explanation' ? 'Explanation' : 'Question';
        link.download = `RMC-PlacementSeries-${date || 'story'}-${modeLabel}-Q${qNum}.png`;
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
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                            Story Generator
                        </h1>
                        <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                            Placement Series 4.0 · 1080 × 1920 Instagram &amp; WhatsApp Story
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 [color-scheme:dark]"
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

                {/* ── Mode Switcher & Question Selector ─────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    {/* Story Mode Toggle */}
                    <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
                        <button
                            onClick={() => {
                                setStoryMode("question");
                                setFooterText("Link in story to solve & submit");
                            }}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                                storyMode === "question"
                                    ? "bg-teal-500 text-black shadow-md"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <HelpCircle className="w-4 h-4" />
                            Question Story
                        </button>
                        <button
                            onClick={() => {
                                setStoryMode("explanation");
                                setFooterText("Full solutions on placement series portal");
                            }}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                                storyMode === "explanation"
                                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <Lightbulb className="w-4 h-4" />
                            Explanation Story
                        </button>
                    </div>

                    {/* Question Tabs */}
                    {questions.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                            {questions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIdx(idx)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                        currentIdx === idx
                                            ? "bg-white text-black font-bold shadow"
                                            : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                    }`}
                                >
                                    Q{idx + 1} {q.category ? `· ${q.category}` : ''}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* ── Workspace: Left Editor, Right Preview ────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    
                    {/* Left: Clean Minimal Editor */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-xl">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {storyMode === "question" ? "Edit Question & Options" : "Edit Question & Explanation"}
                                </h2>
                                <span className="text-[11px] text-white/40 font-mono">
                                    {storyMode === "question" ? "Options Mode" : "Solution Mode"}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                                        Question Statement
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={customQuestionText}
                                        onChange={(e) => setCustomQuestionText(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400/50 resize-none font-sans"
                                    />
                                </div>

                                {storyMode === "question" ? (
                                    /* Options Editor */
                                    <div className="space-y-2.5">
                                        <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                                            Options (A, B, C, D)
                                        </label>
                                        {["A", "B", "C", "D"].map((letter, i) => (
                                            <div key={letter} className="flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/70 shrink-0 font-mono">
                                                    {letter}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={customOptions[i] || ""}
                                                    onChange={(e) => {
                                                        const updated = [...customOptions];
                                                        updated[i] = e.target.value;
                                                        setCustomOptions(updated);
                                                    }}
                                                    placeholder={`Option ${letter}`}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400/50"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Explanation Editor */
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                                                Correct Option
                                            </label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {["A", "B", "C", "D"].map((letter, idx) => (
                                                    <button
                                                        key={letter}
                                                        type="button"
                                                        onClick={() => setCustomCorrectOption(idx)}
                                                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                                            customCorrectOption === idx
                                                                ? "bg-purple-500 border-purple-500 text-white shadow-md"
                                                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                                        }`}
                                                    >
                                                        Option {letter}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                                                Step-by-Step Explanation / Solution
                                            </label>
                                            <textarea
                                                rows={5}
                                                value={customExplanation}
                                                onChange={(e) => setCustomExplanation(e.target.value)}
                                                placeholder="Write step-by-step mathematical steps or reasoning here..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400/50 resize-none font-sans leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Footer Text */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                                            Footer Banner
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-white/60">
                                            <input
                                                type="checkbox"
                                                checked={showFooter}
                                                onChange={(e) => setShowFooter(e.target.checked)}
                                                className="rounded bg-white/10 border-white/20 text-teal-400 focus:ring-0"
                                            />
                                            Show Banner
                                        </label>
                                    </div>
                                    {showFooter && (
                                        <input
                                            type="text"
                                            value={footerText}
                                            onChange={(e) => setFooterText(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400/50"
                                        />
                                    )}
                                </div>

                                {/* Company Logo */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5" />
                                            Company Logo
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-white/60">
                                            <input
                                                type="checkbox"
                                                checked={showCompanyLogo}
                                                onChange={(e) => setShowCompanyLogo(e.target.checked)}
                                                className="rounded bg-white/10 border-white/20 text-teal-400 focus:ring-0"
                                            />
                                            Show Logo
                                        </label>
                                    </div>
                                    <div className={`text-xs px-3 py-2 rounded-xl border ${companyLogo ? 'bg-teal-500/10 border-teal-500/20 text-teal-300' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                        {companyLogo
                                            ? <span>✓ Detected: <span className="font-bold">{companyLogo}</span></span>
                                            : <span>No company detected from tags/category</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-5 py-3 rounded-xl font-bold transition-all text-sm shadow-lg hover:shadow-teal-500/20 active:scale-[0.98]"
                            >
                                {downloadDone ? <Check className="w-4 h-4 text-black" /> : <Download className="w-4 h-4" />}
                                {downloadDone ? "Saved!" : "Download Story PNG"}
                            </button>

                            <button
                                onClick={handleCopyImage}
                                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl font-bold transition-all text-sm border border-white/10 active:scale-[0.98]"
                            >
                                {copiedDone ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                                {copiedDone ? "Copied to Clipboard!" : "Copy Image"}
                            </button>
                        </div>
                    </div>

                    {/* Right: Live Canvas Preview */}
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 relative">
                            <canvas
                                ref={canvasRef}
                                width={1080}
                                height={1920}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <p className="text-[11px] text-white/40 mt-3 text-center">
                            Live 1080 × 1920 preview · Optimized for Instagram &amp; WhatsApp Story
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
