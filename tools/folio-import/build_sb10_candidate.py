import json
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[2]

CANONICAL = ROOT / "library/books/sb-10/book.json"
GENERATED = ROOT / "tools/folio-import/generated/sb10-records.json"
OUTPUT = ROOT / "tools/folio-import/generated/sb10-book-candidate.json"

book = json.loads(CANONICAL.read_text(encoding="utf-8"))
folio = json.loads(GENERATED.read_text(encoding="utf-8"))["records"]

# ------------------------------------------------------------
# Preserve existing canonical Chapters 1–13 exactly.
# ------------------------------------------------------------

preserved_sections = []

for section in book["sections"]:
    refs = [
        v.get("reference", "")
        for v in section.get("verses", [])
    ]

    chapter = None

    for ref in refs:
        m = re.match(r"10\.(\d+)\.", ref)
        if m:
            chapter = int(m.group(1))
            break

    if chapter is not None and chapter <= 13:
        preserved_sections.append(section)

# ------------------------------------------------------------
# Group Folio records for Chapters 14–90.
# ------------------------------------------------------------

chapters = defaultdict(list)

for record in folio:
    m = re.fullmatch(r"10\.(\d+)\.(\d+(?:-\d+)?)", record["reference"])

    if not m:
        raise ValueError(f"Unexpected reference: {record['reference']}")

    chapter = int(m.group(1))

    if 14 <= chapter <= 90:
        chapters[chapter].append(record)

# ------------------------------------------------------------
# Build new canonical sections.
# Scripture is stored once here; course data will reference it.
# ------------------------------------------------------------

new_sections = []

for chapter in range(14, 91):

    records = chapters.get(chapter, [])

    if not records:
        raise ValueError(f"No Folio records for Chapter {chapter}")

    verses = []

    for record in records:
        ref = record["reference"]
        verse_part = ref.split(".", 2)[2]

        verses.append({
            "id": f"SB.10.10.{chapter}.{verse_part}",
            "reference": ref,

            # Folio f48 Devanagari/legacy Sanskrit encoding has not
            # been independently validated, so do not fabricate it.
            "devanagari": "",

            "transliteration": record.get("transliteration", ""),
            "synonyms": record.get("synonyms", ""),
            "translation": record.get("translation", ""),
            "purport": record.get("purport", "")
        })

    new_sections.append({
        "id": f"chapter-{chapter}",
        "kind": "study-section",

        # Neutral title until chapter-title extraction is independently
        # validated from the source.
        "title": f"Chapter {chapter}",

        # This chapter came from the local Folio import rather than EPUB.
        "source_href": f"folio:SB.10.{chapter}",

        "verses": verses
    })

# ------------------------------------------------------------
# Candidate book.
# Keep existing book metadata for now.
# Provenance refinement happens before canonical replacement.
# ------------------------------------------------------------

candidate = dict(book)
candidate["sections"] = preserved_sections + new_sections

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(
    json.dumps(candidate, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

# ------------------------------------------------------------
# Validation
# ------------------------------------------------------------

all_verses = [
    verse
    for section in candidate["sections"]
    for verse in section.get("verses", [])
]

refs = [v["reference"] for v in all_verses]

chapter_numbers = sorted({
    int(ref.split(".")[1])
    for ref in refs
    if ref.startswith("10.")
})

duplicate_refs = sorted({
    ref for ref in refs if refs.count(ref) > 1
})

missing_core = []

for v in all_verses:
    for field in ("reference", "transliteration", "synonyms", "translation"):
        if not v.get(field):
            missing_core.append((v["reference"], field))

print("Candidate:", OUTPUT)
print("Sections:", len(candidate["sections"]))
print("Verses:", len(all_verses))
print("Chapters:", f"{chapter_numbers[0]}–{chapter_numbers[-1]}")
print("Missing chapters:",
      [n for n in range(1, 91) if n not in chapter_numbers] or "NONE")
print("Duplicate references:", duplicate_refs or "NONE")
print("Missing core fields:", len(missing_core))
print("Live canonical book modified: NO")
