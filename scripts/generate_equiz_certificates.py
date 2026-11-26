#!/usr/bin/env python3
"""Generate e-quiz certificates from the supplied A4 landscape PDF template.

Input CSV columns:
  participant_name (required), certificate_id (optional), email (optional)

The template is kept as the PDF background. The placeholder name is covered
and replaced, and a QR code for the certificate verification URL is placed in
the reserved lower-left box.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import secrets
from datetime import date, datetime, timezone
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib.utils import ImageReader


PAGE_WIDTH = 841.8898
PAGE_HEIGHT = 595.2756
# Coordinates are PDF points, measured against the supplied template.
# The placeholder is part of the first body line. Repainting the whole line
# avoids leaving the first glyph of "participated" behind when a name is long.
FIRST_LINE_BOX = (70.0, 318.0, 720.0, 32.0)
# Exact gap occupied by the event title on the template's second body line.
EVENT_TITLE_BOX = (133.5, 292.0, 204.0, 30.0)
QR_BOX = (80.0, 117.0, 86.0, 86.0)
RMC_LOGO = Path(__file__).resolve().parents[1] / "public" / "full logo.png"
TEXT_COLOR = Color(0.10, 0.14, 0.21)


def register_font(font_name: str, candidates: list[Path], fallback: str) -> str:
    for path in candidates:
        if path.exists():
            pdfmetrics.registerFont(TTFont(font_name, str(path)))
            return font_name
    return fallback


def register_name_font() -> str:
    """Use a serif font close to the embedded template typography."""
    candidates = [Path(r"C:\Windows\Fonts\georgia.ttf"), Path(r"C:\Windows\Fonts\times.ttf")]
    return register_font("EquizRegular", candidates, "Times-Roman")


def register_name_bold_font() -> str:
    candidates = [Path(r"C:\Windows\Fonts\georgiab.ttf"), Path(r"C:\Windows\Fonts\timesbd.ttf")]
    return register_font("EquizBold", candidates, "Times-Bold")


NAME_FONT = register_name_font()
NAME_BOLD_FONT = register_name_bold_font()


def safe_filename(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", value.strip())
    return re.sub(r"_+", "_", cleaned).strip("_") or "Participant"


def make_certificate_id() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    suffix = "".join(secrets.choice(alphabet) for _ in range(4))
    return f"CERT-{date.today():%Y%m%d}-{suffix}"


def fit_font_size(text: str, max_width: float, preferred: float = 19.7, font_name: str = NAME_FONT) -> float:
    size = preferred
    while size > 10 and pdfmetrics.stringWidth(text, font_name, size) > max_width:
        size -= 0.25
    if pdfmetrics.stringWidth(text, font_name, size) > max_width:
        raise ValueError(f"Participant name is too long to fit: {text!r}")
    return size


def fit_mixed_font_size(segments: list[tuple[str, str]], max_width: float, preferred: float = 19.74) -> float:
    size = preferred
    while size > 10 and sum(pdfmetrics.stringWidth(text, font, size) for text, font in segments) > max_width:
        size -= 0.25
    if sum(pdfmetrics.stringWidth(text, font, size) for text, font in segments) > max_width:
        raise ValueError("Participant name is too long to fit")
    return size


def draw_mixed_centered(c: canvas.Canvas, segments: list[tuple[str, str]], center_x: float, baseline_y: float, size: float) -> None:
    total_width = sum(pdfmetrics.stringWidth(text, font, size) for text, font in segments)
    current_x = center_x - total_width / 2
    for text, font in segments:
        c.setFont(font, size)
        c.drawString(current_x, baseline_y, text)
        current_x += pdfmetrics.stringWidth(text, font, size)


def verification_url(cert_id: str, base_url: str) -> str:
    return f"{base_url.rstrip('/')}/verify/{cert_id}"


def overlay_pdf(participant_name: str, cert_id: str, base_url: str) -> PdfReader:
    from io import BytesIO

    stream = BytesIO()
    c = canvas.Canvas(stream, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))

    # Remove the embedded first body line, including [Participant Name].
    x, y, w, h = FIRST_LINE_BOX
    c.setFillColor(white)
    c.rect(x, y, w, h, stroke=0, fill=1)

    first_line_segments = [
        ("This is to certify that Mr./Ms. ", NAME_FONT),
        (participant_name, NAME_BOLD_FONT),
        (" participated in the", NAME_FONT),
    ]
    c.setFillColor(TEXT_COLOR)
    size = fit_mixed_font_size(first_line_segments, w - 8)
    draw_mixed_centered(c, first_line_segments, x + w / 2, y + 5.0, size)

    # Replace only the event title phrase so it is visibly bold while the
    # template's surrounding sentence remains unchanged.
    event_x, event_y, event_w, event_h = EVENT_TITLE_BOX
    c.setFillColor(white)
    c.rect(event_x, event_y, event_w, event_h, stroke=0, fill=1)
    c.setFillColor(TEXT_COLOR)
    event_title = "National Level E-Quiz"
    event_size = fit_font_size(event_title, event_w - 4, preferred=19.74, font_name=NAME_BOLD_FONT)
    event_width = pdfmetrics.stringWidth(event_title, NAME_BOLD_FONT, event_size)
    c.setFont(NAME_BOLD_FONT, event_size)
    c.drawString(event_x + (event_w - event_width) / 2, event_y + 5.0, event_title)

    # Build a high-error-correction QR and draw it as vector modules.
    q = qr.QrCodeWidget(verification_url(cert_id, base_url), barLevel="H")
    quiet_zone = 5.0
    qr_size = QR_BOX[2] - quiet_zone * 2
    q.barHeight = qr_size
    q.barWidth = qr_size
    q.barBorder = 1
    drawing = Drawing(qr_size, qr_size)
    drawing.add(q)
    c.setFillColor(white)
    c.rect(QR_BOX[0], QR_BOX[1], QR_BOX[2], QR_BOX[3], stroke=0, fill=1)
    drawing.drawOn(c, QR_BOX[0] + quiet_zone, QR_BOX[1] + quiet_zone)

    # Add the RMC mark in the quiet center of the high-error-correction QR.
    # The white backing preserves the contrast needed for reliable scanning.
    if RMC_LOGO.exists():
        logo_size = 12.0
        backing = logo_size + 6.0
        logo_x = QR_BOX[0] + (QR_BOX[2] - backing) / 2
        logo_y = QR_BOX[1] + (QR_BOX[3] - backing) / 2
        c.setFillColor(white)
        c.roundRect(logo_x, logo_y, backing, backing, 2.5, stroke=0, fill=1)
        c.drawImage(
            ImageReader(str(RMC_LOGO)),
            logo_x + 3.0,
            logo_y + 3.0,
            width=logo_size,
            height=logo_size,
            preserveAspectRatio=True,
            mask="auto",
        )

    c.save()
    stream.seek(0)
    return PdfReader(stream)


def generate_one(template: Path, output: Path, name: str, cert_id: str, base_url: str) -> None:
    background = PdfReader(str(template))
    if len(background.pages) != 1:
        raise ValueError("The e-quiz template must contain exactly one page")
    page = background.pages[0]
    if abs(float(page.mediabox.width) - PAGE_WIDTH) > 1 or abs(float(page.mediabox.height) - PAGE_HEIGHT) > 1:
        raise ValueError("The e-quiz template must be A4 landscape")
    page.merge_page(overlay_pdf(name, cert_id, base_url).pages[0])
    writer = PdfWriter()
    writer.add_page(page)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as handle:
        writer.write(handle)


def read_rows(input_csv: Path) -> list[dict[str, str]]:
    with input_csv.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValueError("The participant CSV is empty")
    normalized = [{(k or "").strip().lower(): (v or "").strip() for k, v in row.items()} for row in rows]
    if any(not row.get("participant_name") for row in normalized):
        raise ValueError("Every row must include participant_name")
    return normalized


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Participant CSV")
    parser.add_argument("--template", type=Path, default=Path("public/certificates/templates/equiz-certificate.pdf"))
    parser.add_argument("--output", type=Path, default=Path("output/pdf/equiz"))
    parser.add_argument("--base-url", default=os.getenv("NEXT_PUBLIC_SITE_URL", "https://rmccbit.in"))
    parser.add_argument("--event-name", default="National Level E-Quiz")
    parser.add_argument("--event-dates", default="30 October to 6 November 2026")
    parser.add_argument("--issued-by", default="Ramanujan Maths Club, CBIT")
    args = parser.parse_args()

    rows = read_rows(args.input)
    if not args.template.exists():
        raise FileNotFoundError(f"Template not found: {args.template}")

    individual = args.output / "individual"
    combined_writer = PdfWriter()
    manifest: list[dict[str, str]] = []
    seen_ids: set[str] = set()
    for row in rows:
        name = row["participant_name"]
        cert_id = row.get("certificate_id") or make_certificate_id()
        if cert_id in seen_ids:
            raise ValueError(f"Duplicate certificate_id: {cert_id}")
        seen_ids.add(cert_id)
        filename = f"RMC_EQuiz_Certificate_{safe_filename(cert_id)}_{safe_filename(name)}.pdf"
        output_file = individual / filename
        generate_one(args.template, output_file, name, cert_id, args.base_url)
        combined_writer.append(str(output_file))
        manifest.append({
            "participant_name": name,
            "certificate_id": cert_id,
            "email": row.get("email", ""),
            "template_name": "equiz-certificate",
            "event_name": args.event_name,
            "event_dates": args.event_dates,
            "date_issued": datetime.now(timezone.utc).isoformat(),
            "status": "ACTIVE",
            "issued_by": args.issued_by,
            "verification_url": verification_url(cert_id, args.base_url),
            "filename": str(output_file),
        })

    combined_dir = args.output / "combined"
    combined_dir.mkdir(parents=True, exist_ok=True)
    combined_path = combined_dir / "RMC_EQuiz_Certificates.pdf"
    with combined_path.open("wb") as handle:
        combined_writer.write(handle)
    with (args.output / "manifest.json").open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
    print(json.dumps({"count": len(manifest), "output": str(args.output), "combined": str(combined_path)}, indent=2))


if __name__ == "__main__":
    main()
