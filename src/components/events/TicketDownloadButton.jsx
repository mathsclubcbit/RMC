"use client";

import { useMemo, useState } from "react";

function wrapText(ctx, text, maxWidth) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const lines = [];
    let current = words[0];

    for (let i = 1; i < words.length; i++) {
        const next = `${current} ${words[i]}`;
        if (ctx.measureText(next).width <= maxWidth) {
            current = next;
        } else {
            lines.push(current);
            current = words[i];
        }
    }
    lines.push(current);
    return lines;
}

async function loadImage(src) {
    return await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export default function TicketDownloadButton({
    event,
    ticketCode,
    qrCodeUrl,
}) {
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState("");

    const filename = useMemo(() => {
        const safeTitle = String(event?.title || "event")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .slice(0, 40);
        const code = String(ticketCode || "ticket");
        return `RMC-${safeTitle}-${code}.png`;
    }, [event?.title, ticketCode]);

    async function onDownload() {
        setError("");
        if (!qrCodeUrl || !ticketCode || !event) {
            setError("Ticket data not ready yet.");
            return;
        }

        setDownloading(true);
        try {
            const W = 1080;
            const H = 1350;
            const canvas = document.createElement("canvas");
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas not supported");

            // Background
            ctx.fillStyle = "#05060a";
            ctx.fillRect(0, 0, W, H);

            // Glow gradients
            const g1 = ctx.createRadialGradient(W * 0.2, H * 0.15, 10, W * 0.2, H * 0.15, 560);
            g1.addColorStop(0, "rgba(45, 212, 191, 0.18)");
            g1.addColorStop(1, "rgba(45, 212, 191, 0)");
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, W, H);

            const g2 = ctx.createRadialGradient(W * 0.85, H * 0.25, 10, W * 0.85, H * 0.25, 600);
            g2.addColorStop(0, "rgba(168, 85, 247, 0.14)");
            g2.addColorStop(1, "rgba(168, 85, 247, 0)");
            ctx.fillStyle = g2;
            ctx.fillRect(0, 0, W, H);

            // Subtle grid lines
            ctx.globalAlpha = 0.10;
            ctx.strokeStyle = "#2dd4bf";
            ctx.lineWidth = 1;
            for (let x = 60; x < W; x += 90) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, H);
                ctx.stroke();
            }
            for (let y = 80; y < H; y += 100) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(W, y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

            // Main glass card
            const cardX = 72;
            const cardY = 72;
            const cardW = W - 144;
            const cardH = H - 144;

            ctx.save();
            drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 40);
            ctx.fillStyle = "rgba(255,255,255,0.06)";
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.10)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // Header
            const logo = await loadImage("/rmc-logo.png");
            const logoSize = 86;
            const headerX = cardX + 56;
            const headerY = cardY + 48;

            // Logo chip
            ctx.save();
            drawRoundedRect(ctx, headerX - 14, headerY - 14, 320, 114, 30);
            ctx.fillStyle = "rgba(0,0,0,0.35)";
            ctx.fill();
            ctx.strokeStyle = "rgba(45,212,191,0.25)";
            ctx.stroke();
            ctx.restore();

            ctx.drawImage(logo, headerX, headerY, logoSize, logoSize);

            ctx.fillStyle = "rgba(255,255,255,0.72)";
            ctx.font = "600 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
            ctx.fillText("RAMANUJAN MATH CLUB", headerX + logoSize + 18, headerY + 30);

            ctx.fillStyle = "rgba(45,212,191,0.95)";
            ctx.font = "800 30px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New'";
            ctx.fillText("ENTRY PASS", headerX + logoSize + 18, headerY + 68);

            // Event title + date
            const titleX = cardX + 56;
            const titleY = cardY + 210;
            const maxTitleWidth = cardW - 112;

            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.font = "800 56px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
            const titleLines = wrapText(ctx, event.title, maxTitleWidth).slice(0, 2);
            titleLines.forEach((line, i) => {
                ctx.fillText(line, titleX, titleY + i * 64);
            });

            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.font = "600 26px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New'";
            const dateText = String(event?.date || event?.startDate || "");
            const dateY = titleY + titleLines.length * 64 + 18;
            ctx.fillText(`DATE: ${dateText}`, titleX, dateY);

            // QR Container
            const qr = await loadImage(qrCodeUrl);
            const qrBoxSize = 520;
            const qrBoxX = cardX + Math.round((cardW - qrBoxSize) / 2);
            const qrBoxY = cardY + 430;

            // White panel
            ctx.save();
            drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 34);
            ctx.fillStyle = "rgba(255,255,255,0.96)";
            ctx.fill();
            ctx.strokeStyle = "rgba(45,212,191,0.65)";
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.restore();

            // QR image inset
            const inset = 26;
            ctx.drawImage(qr, qrBoxX + inset, qrBoxY + inset, qrBoxSize - inset * 2, qrBoxSize - inset * 2);

            // RMC Logo overlay on QR
            const qrCenterLogoSize = 130;
            const qrCenterX = qrBoxX + qrBoxSize / 2;
            const qrCenterY = qrBoxY + qrBoxSize / 2;

            ctx.save();
            // White background circle for readability
            ctx.shadowColor = "rgba(0,0,0,0.2)";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(qrCenterX, qrCenterY, qrCenterLogoSize / 2 + 8, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();

            // Draw logo
            ctx.drawImage(logo, qrCenterX - qrCenterLogoSize / 2, qrCenterY - qrCenterLogoSize / 2, qrCenterLogoSize, qrCenterLogoSize);
            ctx.restore();

            // Ticket code
            const codeY = qrBoxY + qrBoxSize + 86;
            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.font = "600 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New'";
            ctx.fillText("TICKET CODE", titleX, codeY - 18);

            ctx.fillStyle = "rgba(45,212,191,0.95)";
            ctx.font = "900 64px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New'";
            ctx.fillText(String(ticketCode), titleX, codeY + 50);

            // Footer note
            ctx.fillStyle = "rgba(255,255,255,0.38)";
            ctx.font = "500 18px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
            ctx.fillText("Present this pass at the venue for scanning.", titleX, cardY + cardH - 64);

            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
            if (!blob) throw new Error("Failed to export image");

            downloadBlob(blob, filename);
        } catch (e) {
            setError(e?.message || "Failed to generate download");
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="w-full">
            {error ? (
                <div className="mb-3 text-xs text-red-200/80 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    {error}
                </div>
            ) : null}

            <button
                type="button"
                onClick={onDownload}
                disabled={downloading || !qrCodeUrl}
                className="w-full md:w-auto px-6 py-3 bg-white/10 border border-white/15 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/15 transition-colors disabled:opacity-60"
            >
                {downloading ? "Generating…" : "Download QR Pass"}
            </button>
        </div>
    );
}
