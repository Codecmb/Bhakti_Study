#!/usr/bin/env python3

import re
from pathlib import Path
from collections import Counter

SOURCE = Path(__file__).with_name("SB_Canto_10_Folio.rtf")

text = SOURCE.read_text(encoding="latin-1")

# Hidden Folio canonical references such as:
# SB 10.1.1
# SB 10.14.1
# SB 10.90.50
pattern = re.compile(r"SB 10\.(\d+)\.(\d+(?:-\d+)?)")

matches = list(pattern.finditer(text))

refs = []
for m in matches:
    chapter = int(m.group(1))
    verse = m.group(2)

    if 1 <= chapter <= 90:
        refs.append(f"10.{chapter}.{verse}")

unique_refs = list(dict.fromkeys(refs))
chapters = Counter(int(ref.split(".")[1]) for ref in unique_refs)

print("FOLIO CANTO 10 STRUCTURE")
print("------------------------")
print("Raw verse-reference matches:", len(refs))
print("Unique verse references:", len(unique_refs))
print("Chapters represented:", len(chapters))
print("First reference:", unique_refs[0] if unique_refs else "NONE")
print("Last reference:", unique_refs[-1] if unique_refs else "NONE")

missing = [c for c in range(1, 91) if c not in chapters]

print("Missing chapters:", missing if missing else "NONE")

print("\nSELECTED CHAPTER COUNTS")
for c in (1, 13, 14, 20, 21, 44, 45, 70, 71, 90):
    print(f"Chapter {c}: {chapters[c]} records")

# ------------------------------------------------------------
# Detect actual Folio verse records.
# A real record begins with the hidden canonical reference and
# is followed shortly afterward by the visible TEXT heading.
# ------------------------------------------------------------

record_pattern = re.compile(
    r"SB 10\.(\d+)\.(\d+(?:-\d+)?)"
    r"[^\n]*\n"
    r"\\par \}\\pard [^\n]*TEXT(?:\s+\d+(?:-\d+)?)?",
    re.MULTILINE
)

record_matches = list(record_pattern.finditer(text))

record_refs = [
    f"10.{int(m.group(1))}.{m.group(2)}"
    for m in record_matches
]

unique_record_refs = list(dict.fromkeys(record_refs))
record_chapters = Counter(
    int(ref.split(".")[1]) for ref in unique_record_refs
)

print("\nACTUAL FOLIO VERSE RECORDS")
print("--------------------------")
print("Detected records:", len(record_matches))
print("Unique records:", len(unique_record_refs))
print("Chapters represented:", len(record_chapters))
print("First record:", unique_record_refs[0] if unique_record_refs else "NONE")
print("Last record:", unique_record_refs[-1] if unique_record_refs else "NONE")

missing_record_chapters = [
    c for c in range(1, 91)
    if c not in record_chapters
]

print(
    "Missing chapters:",
    missing_record_chapters if missing_record_chapters else "NONE"
)

# ------------------------------------------------------------
# Decode Folio f0 transliteration.
# Mapping is maintained separately so the legacy encoding logic
# remains isolated from record extraction.
# ------------------------------------------------------------

import importlib.util
import json

ENCODING_FILE = Path(__file__).with_name("folio_encoding.py")

spec = importlib.util.spec_from_file_location(
    "folio_encoding",
    ENCODING_FILE
)
folio_encoding = importlib.util.module_from_spec(spec)
spec.loader.exec_module(folio_encoding)

FOLIO_MAP = folio_encoding.FOLIO_TRANSLITERATION_MAP


def decode_folio_transliteration(value):
    def replace_hex(match):
        code = match.group(1).lower()
        return FOLIO_MAP.get(code, f"[UNMAPPED:{code}]")

    return re.sub(
        r"\\'([0-9a-fA-F]{2})",
        replace_hex,
        value
    )


# ------------------------------------------------------------
# Validation control:
# compare Folio transliteration against canonical SB 10.1-13.
# This does NOT modify canonical data.
# ------------------------------------------------------------

BOOK = Path(__file__).parents[2] / "library/books/sb-10/book.json"

canonical_book = json.loads(
    BOOK.read_text(encoding="utf-8")
)

canonical_transliterations = {}

for section in canonical_book["sections"]:
    for verse in section["verses"]:
        value = verse.get("transliteration", "")

        # book.json stores line breaks as the literal two-character
        # sequence backslash+n. Normalize only for validation.
        value = value.replace("\\n", " ")
        value = " ".join(value.split())

        canonical_transliterations[verse["reference"]] = value


def extract_folio_transliteration(start, end):
    block = text[start:end]

    # Transliteration occurs after TEXT and before SYNONYMS.
    synonyms = re.search(r"\bSYNONYMS\b", block)
    if synonyms:
        block = block[:synonyms.start()]

    lines = []

    for raw_line in block.splitlines():
        # Only actual verse/transliteration paragraph styles.
        if not re.search(r"\\s(?:2304|9)\b", raw_line):
            continue

        # Ignore legacy Sanskrit font; transliteration is Folio font 0.
        if r"\f0" not in raw_line or r"\i" not in raw_line:
            continue

        # A line can contain multiple RTF groups, all belonging to the
        # same transliteration line.
        parts = re.findall(
            r"\{\\i\\f0[^{}]*?\s([^{}]*)",
            raw_line
        )

        if parts:
            lines.append("".join(parts))

    # Rare Folio formatting fallback:
    # some records place the Sanskrit in legacy f48 and the corresponding
    # transliteration in an unstyled italic f0 group.
    if not lines:
        for raw_line in block.splitlines():
            if r"\f48" in raw_line:
                continue
            if r"\f0" not in raw_line:
                continue

            parts = re.findall(
                r"\{\\i\\f0[^{}]*?\s([^{}]*)",
                raw_line
            )

            if parts:
                lines.append("".join(parts))

    decoded = [
        decode_folio_transliteration(line).strip()
        for line in lines
    ]

    return " ".join(x for x in decoded if x)

checked = 0
exact = 0
different = []
unmapped = Counter()

for i, match in enumerate(record_matches):
    chapter = int(match.group(1))

    if chapter > 13:
        continue

    ref = f"10.{chapter}.{match.group(2)}"

    if ref not in canonical_transliterations:
        continue

    end = (
        record_matches[i + 1].start()
        if i + 1 < len(record_matches)
        else len(text)
    )

    folio_value = extract_folio_transliteration(
        match.start(),
        end
    )

    canonical_value = canonical_transliterations[ref]

    # Validation only: canonical source uses backslashes as
    # transliteration line separators; Folio uses separate paragraphs.
    canonical_value = canonical_value.replace("\\", "")
    canonical_value = " ".join(canonical_value.split())
    folio_value = " ".join(folio_value.split())

    checked += 1

    for code in re.findall(
        r"\[UNMAPPED:([0-9a-f]+)\]",
        folio_value
    ):
        unmapped[code] += 1

    if folio_value == canonical_value:
        exact += 1
    else:
        different.append(ref)


print("\nTRANSLITERATION VALIDATION — CHAPTERS 1–13")
print("------------------------------------------")
print("Compared:", checked)
print("Exact matches:", exact)
print("Different:", len(different))
print(
    "Unmapped codes:",
    dict(unmapped) if unmapped else "NONE"
)

if different:
    print("First differing refs:", ", ".join(different[:10]))

# ------------------------------------------------------------
# Structured Folio record extraction
# Output is temporary development data only.
# Canonical library/books/sb-10/book.json is NOT modified.
# ------------------------------------------------------------

def decode_general_text(value):
    """Decode Folio prose while removing RTF formatting safely."""

    # Decode Folio/RTF hex escapes first.
    value = re.sub(
        r"\\'([0-9a-fA-F]{2})",
        lambda m: folio_encoding.decode_rtf_hex(m.group(1)),
        value
    )

    # Explicit RTF semantic separators represent real textual spacing.
    value = re.sub(r"\\line\b ?", " ", value)
    value = re.sub(r"\\tab\b ?", " ", value)
    value = re.sub(r"\\par\b ?", " ", value)

    # Physical newlines in the Folio export are storage wrapping and can
    # occur inside words. Remove them rather than converting them to spaces.
    value = value.replace("\r\n", "")
    value = value.replace("\n", "")
    value = value.replace("\r", "")

    # Decode escaped RTF literal characters before removing formatting.
    value = value.replace(r"\{", "\uFFF0")
    value = value.replace(r"\}", "\uFFF1")
    value = value.replace(r"\\", "\uFFF2")

    # Remove remaining RTF control words.
    # Do not consume following visible text unless RTF provides the
    # optional delimiter space.
    value = re.sub(r"\\[a-zA-Z]+-?\d*(?: )?", "", value)

    # Remove RTF structural braces.
    value = value.replace("{", "").replace("}", "")

    # Restore escaped literal characters.
    value = value.replace("\uFFF0", "{")
    value = value.replace("\uFFF1", "}")
    value = value.replace("\uFFF2", "\\")

    # Normalize whitespace introduced by legitimate RTF boundaries.
    return " ".join(value.split()).strip()

def section_after_heading(block, heading, next_headings):
    """Return raw RTF content between one visible heading and the next."""
    start = re.search(
        rf"\b{re.escape(heading)}\b[^\n]*\n",
        block
    )

    if not start:
        return ""

    content_start = start.end()
    content_end = len(block)

    for next_heading in next_headings:
        m = re.search(
            rf"\b{re.escape(next_heading)}\b[^\n]*\n",
            block[content_start:]
        )
        if m:
            candidate = content_start + m.start()
            if candidate < content_end:
                content_end = candidate

    return block[content_start:content_end]


def extract_record(match, end):
    chapter = int(match.group(1))
    verse = match.group(2)
    ref = f"10.{chapter}.{verse}"

    block = text[match.start():end]

    transliteration = extract_folio_transliteration(
        match.start(),
        end
    )

    synonyms_raw = section_after_heading(
        block,
        "SYNONYMS",
        ["TRANSLATION", "PURPORT"]
    )

    translation_raw = section_after_heading(
        block,
        "TRANSLATION",
        ["PURPORT"]
    )

    purport_raw = section_after_heading(
        block,
        "PURPORT",
        []
    )

    return {
        "reference": ref,
        "transliteration": transliteration,
        "synonyms": decode_general_text(synonyms_raw),
        "translation": decode_general_text(translation_raw),
        "purport": decode_general_text(purport_raw),
    }


records = []

for i, match in enumerate(record_matches):
    end = (
        record_matches[i + 1].start()
        if i + 1 < len(record_matches)
        else len(text)
    )

    records.append(extract_record(match, end))


GENERATED = Path(__file__).with_name("generated")
GENERATED.mkdir(exist_ok=True)

OUTPUT = GENERATED / "sb10-records.json"

OUTPUT.write_text(
    json.dumps(
        {
            "schema": "bhakti-study.folio-import.v1",
            "source": "SB_Canto_10_Folio.rtf",
            "recordCount": len(records),
            "records": records,
        },
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)


with_synonyms = sum(bool(r["synonyms"]) for r in records)
with_translation = sum(bool(r["translation"]) for r in records)
with_purport = sum(bool(r["purport"]) for r in records)

print("\nSTRUCTURED EXTRACTION")
print("---------------------")
print("Records:", len(records))
print("With transliteration:", sum(bool(r["transliteration"]) for r in records))
print("With synonyms:", with_synonyms)
print("With translation:", with_translation)
print("With purport:", with_purport)
print("Output:", OUTPUT)
