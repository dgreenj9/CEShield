#!/usr/bin/env python3
"""Parse the strict-OOXML xlsx from Advocate research librarians.

openpyxl can't read conformance="strict" workbooks. This goes straight to the
unzipped XML. Output: JSON keyed by sheet (certification) → list of row dicts.
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

# Strict namespaces (purl.oclc.org) vs transitional (schemas.openxmlformats.org).
NS_STRICT = "http://purl.oclc.org/ooxml/spreadsheetml/main"
NS_R_STRICT = "http://purl.oclc.org/ooxml/officeDocument/relationships"
NS_TRANS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_R_TRANS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

# Match either namespace.
NS = {"s": NS_STRICT, "r": NS_R_STRICT, "t": NS_TRANS, "tr": NS_R_TRANS}


def localname(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def col_letter_to_index(letters: str) -> int:
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch.upper()) - ord("A") + 1)
    return n - 1


def parse_cell_ref(ref: str) -> tuple[int, int]:
    m = re.match(r"([A-Z]+)(\d+)", ref)
    if not m:
        return 0, 0
    return int(m.group(2)) - 1, col_letter_to_index(m.group(1))


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    with zf.open("xl/sharedStrings.xml") as f:
        tree = ET.parse(f)
    out: list[str] = []
    for si in tree.getroot():
        if localname(si.tag) != "si":
            continue
        # Concatenate all text descendants (handles rich text runs).
        text_parts: list[str] = []
        for t in si.iter():
            if localname(t.tag) == "t" and t.text:
                text_parts.append(t.text)
        out.append("".join(text_parts))
    return out


def load_workbook_index(zf: zipfile.ZipFile) -> list[tuple[str, str]]:
    """Return [(sheet_name, sheet_xml_path), ...] in workbook order."""
    with zf.open("xl/workbook.xml") as f:
        wb_tree = ET.parse(f)
    with zf.open("xl/_rels/workbook.xml.rels") as f:
        rels_tree = ET.parse(f)

    rels: dict[str, str] = {}
    for rel in rels_tree.getroot():
        rels[rel.get("Id")] = rel.get("Target")

    sheets: list[tuple[str, str]] = []
    for elem in wb_tree.getroot().iter():
        if localname(elem.tag) == "sheet":
            name = elem.get("name")
            rid = (
                elem.get(f"{{{NS_R_STRICT}}}id")
                or elem.get(f"{{{NS_R_TRANS}}}id")
            )
            target = rels.get(rid)
            if target:
                if not target.startswith("xl/"):
                    target = "xl/" + target.lstrip("/")
                sheets.append((name, target))
    return sheets


def parse_sheet(zf: zipfile.ZipFile, sheet_path: str, sst: list[str]) -> list[list[str]]:
    with zf.open(sheet_path) as f:
        tree = ET.parse(f)
    root = tree.getroot()
    rows: list[list[str]] = []
    max_col = 0
    raw: list[tuple[int, int, str]] = []
    for row_el in root.iter():
        if localname(row_el.tag) != "row":
            continue
        for cell in row_el:
            if localname(cell.tag) != "c":
                continue
            ref = cell.get("r", "")
            ctype = cell.get("t", "n")
            r, c = parse_cell_ref(ref)
            max_col = max(max_col, c)
            value = ""
            v_el = next((x for x in cell if localname(x.tag) == "v"), None)
            is_el = next((x for x in cell if localname(x.tag) == "is"), None)
            if ctype == "s" and v_el is not None and v_el.text:
                try:
                    value = sst[int(v_el.text)]
                except (ValueError, IndexError):
                    value = v_el.text
            elif ctype == "inlineStr" and is_el is not None:
                value = "".join(
                    t.text or "" for t in is_el.iter() if localname(t.tag) == "t"
                )
            elif v_el is not None and v_el.text:
                value = v_el.text
            raw.append((r, c, value))

    if not raw:
        return []
    max_row = max(r for r, _, _ in raw)
    grid: list[list[str]] = [["" for _ in range(max_col + 1)] for _ in range(max_row + 1)]
    for r, c, v in raw:
        grid[r][c] = v
    return grid


def main(in_path: str, out_path: str) -> None:
    src = Path(in_path)
    if not src.exists():
        raise SystemExit(f"not found: {src}")

    with zipfile.ZipFile(src) as zf:
        sst = load_shared_strings(zf)
        sheets = load_workbook_index(zf)
        result: dict[str, dict] = {}
        for name, path in sheets:
            grid = parse_sheet(zf, path, sst)
            result[name] = {
                "row_count": len(grid),
                "col_count": max((len(r) for r in grid), default=0),
                "rows": grid,
            }
            print(f"  {name}: {len(grid)}r x {max((len(r) for r in grid), default=0)}c")

    Path(out_path).write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"\nwrote {out_path}  ({len(result)} sheets, {sum(s['row_count'] for s in result.values())} rows total)")


if __name__ == "__main__":
    args = sys.argv[1:] or [
        "/Users/danielgreen/Downloads/Consolidated Green Searches 2_03.2026.xlsx",
        "/Users/danielgreen/il-ce-tracker/scripts/consolidated_green.json",
    ]
    main(*args)
