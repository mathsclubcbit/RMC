#!/usr/bin/env python3
"""Smoke test the e-quiz certificate generator with representative names."""

import csv
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from pypdf import PdfReader
import fitz


ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / "tmp" / "pdfs" / "equiz-test"
CSV = TMP / "participants.csv"
OUT = TMP / "output"


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    with CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["participant_name", "certificate_id", "email"])
        writer.writeheader()
        writer.writerows([
            {"participant_name": "Asha Rao", "certificate_id": "CERT-20261126-TEST", "email": "asha@example.com"},
            {"participant_name": "Dr. Ananya Venkatesh Kumar", "certificate_id": "CERT-20261126-LONG", "email": "ananya@example.com"},
            {"participant_name": "O'Neil, R. K.", "certificate_id": "CERT-20261126-SPEC", "email": "oneil@example.com"},
        ])
    subprocess.run([
        sys.executable, str(ROOT / "scripts" / "generate_equiz_certificates.py"),
        "--input", str(CSV), "--output", str(OUT),
        "--base-url", "https://example.test",
    ], cwd=ROOT, check=True)

    manifest = json.loads((OUT / "manifest.json").read_text(encoding="utf-8"))
    assert len(manifest) == 3
    assert len(list((OUT / "individual").glob("*.pdf"))) == 3
    assert len(PdfReader(str(OUT / "combined" / "RMC_EQuiz_Certificates.pdf")).pages) == 3
    assert all(item["verification_url"].startswith("https://example.test/verify/CERT-") for item in manifest)
    # Decode the rendered QR, including the centered RMC logo.
    pdf = PdfReader(str(OUT / "individual" / "RMC_EQuiz_Certificate_CERT-20261126-LONG_Dr_Ananya_Venkatesh_Kumar.pdf"))
    page = fitz.open(str(OUT / "individual" / "RMC_EQuiz_Certificate_CERT-20261126-LONG_Dr_Ananya_Venkatesh_Kumar.pdf"))[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(3, 3), alpha=False)
    image = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    crop = image[int(image.shape[0] * 0.62):int(image.shape[0] * 0.90), 0:int(image.shape[1] * 0.28)]
    decoded, points, _ = cv2.QRCodeDetector().detectAndDecode(crop)
    assert points is not None and decoded == "https://example.test/verify/CERT-20261126-LONG"
    print("e-quiz certificate smoke test passed: 3 PDFs, combined PDF, manifest")


if __name__ == "__main__":
    main()
