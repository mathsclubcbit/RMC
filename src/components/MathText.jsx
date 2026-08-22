"use client";

/**
 * MathText — renders text that may contain LaTeX math expressions.
 *
 * Supports:
 *   - Inline math:  $x^2 + y^2$   or   \( x^2 \)
 *   - Block math:   $$\frac{a}{b}$$   or   \[ \frac{a}{b} \]
 *   - Plain text with no math: rendered as-is, no overhead.
 *
 * If KaTeX fails to parse an expression, it falls back to rendering
 * the raw LaTeX string so nothing is silently swallowed.
 *
 * Usage:
 *   <MathText text="Find x if $x^2 - 4 = 0$." />
 *   <MathText text="$$\log_2(8) = ?$$" block />
 */

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Regex to split text into math and non-math segments.
// Matches:
//   $$...$$  or  \[...\]  (display/block math)
//   $...$    or  \(...\)  (inline math)
const MATH_SPLIT_REGEX = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([\s\S]+?\\\))/g;

function renderKatex(raw, displayMode) {
    // Strip delimiters
    let expr = raw;
    if (raw.startsWith("$$") && raw.endsWith("$$")) {
        expr = raw.slice(2, -2);
    } else if (raw.startsWith("\\[") && raw.endsWith("\\]")) {
        expr = raw.slice(2, -2);
    } else if (raw.startsWith("$") && raw.endsWith("$")) {
        expr = raw.slice(1, -1);
    } else if (raw.startsWith("\\(") && raw.endsWith("\\)")) {
        expr = raw.slice(2, -2);
    }

    try {
        const html = katex.renderToString(expr.trim(), {
            displayMode,
            throwOnError: false,
            strict: false,
            trust: false,
        });
        return { html, error: false };
    } catch {
        return { html: raw, error: true };
    }
}

export default function MathText({ text, className = "" }) {
    const segments = useMemo(() => {
        if (!text) return [];

        // Fast path: no math delimiters present — render as plain text
        if (!text.includes("$") && !text.includes("\\(") && !text.includes("\\[")) {
            return [{ type: "text", content: text }];
        }

        const parts = text.split(MATH_SPLIT_REGEX);
        return parts.map((part) => {
            if (!part) return null;

            const isBlock =
                (part.startsWith("$$") && part.endsWith("$$")) ||
                (part.startsWith("\\[") && part.endsWith("\\]"));
            const isInline =
                (part.startsWith("$") && part.endsWith("$") && !isBlock) ||
                (part.startsWith("\\(") && part.endsWith("\\)"));

            if (isBlock) {
                const { html, error } = renderKatex(part, true);
                return { type: "block", html, error, raw: part };
            }
            if (isInline) {
                const { html, error } = renderKatex(part, false);
                return { type: "inline", html, error, raw: part };
            }
            return { type: "text", content: part };
        }).filter(Boolean);
    }, [text]);

    if (!segments.length) return null;

    // Fast path: purely plain text
    if (segments.length === 1 && segments[0].type === "text") {
        return <span className={className}>{segments[0].content}</span>;
    }

    return (
        <span className={className}>
            {segments.map((seg, i) => {
                if (seg.type === "text") {
                    return <span key={i}>{seg.content}</span>;
                }
                if (seg.type === "block") {
                    if (seg.error) {
                        return <code key={i} className="text-red-400 text-sm font-mono">{seg.raw}</code>;
                    }
                    return (
                        <span
                            key={i}
                            className="block my-3 overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: seg.html }}
                        />
                    );
                }
                // inline
                if (seg.error) {
                    return <code key={i} className="text-yellow-400 text-sm font-mono">{seg.raw}</code>;
                }
                return (
                    <span
                        key={i}
                        dangerouslySetInnerHTML={{ __html: seg.html }}
                    />
                );
            })}
        </span>
    );
}
