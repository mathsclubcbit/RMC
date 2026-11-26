#!/usr/bin/env python3
"""Convert the supplied participant workbook into the e-quiz CSV input."""

from __future__ import annotations

import csv
import sys
from pathlib import Path

from openpyxl import load_workbook


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: prepare_equiz_participants.py INPUT.xlsx OUTPUT.csv")
    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    worksheet = load_workbook(input_path, read_only=True, data_only=True).active
    rows = worksheet.iter_rows(values_only=True)
    headers = [str(value or "").strip() for value in next(rows)]
    required = ["Candidate's Name", "Candidate's Email", "Percentage Score"]
    missing = [column for column in required if column not in headers]
    if missing:
        raise ValueError(f"Missing required workbook columns: {missing}")
    index = {header: position for position, header in enumerate(headers)}
    output = []
    for row in rows:
        name = str(row[index["Candidate's Name"]] or "").strip()
        email = str(row[index["Candidate's Email"]] or "").strip()
        score = float(row[index["Percentage Score"]] or 0)
        if not name or not email:
            raise ValueError("Every participant must have a name and email")
        if score < 65:
            raise ValueError(f"Participant below 65% threshold: {name} ({score})")
        output.append({"participant_name": name, "email": email})
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["participant_name", "email"])
        writer.writeheader()
        writer.writerows(output)
    print(f"prepared {len(output)} participants")


if __name__ == "__main__":
    main()
