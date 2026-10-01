#!/usr/bin/env python3

import importlib.util
import json
import re
from pathlib import Path

SOURCE = (
    Path.home()
    / ".wine/drive_c/Bhaktivedanta VedaBase 2003/Nfo"
    / "Vedabase_2003_Complete.rtf"
)

ENCODING_FILE = Path(__file__).with_name("folio_encoding.py")

spec = importlib.util.spec_from_file_location(
    "folio_encoding",
    ENCODING_FILE
)
folio_encoding = importlib.util.module_from_spec(spec)
spec.loader.exec_module(folio_encoding)


def decode_general_text(value):
    # Bookmark groups are Folio/RTF navigation metadata, not visible book text.
    value = re.sub(
        r"\{\\\*\\bkmk(?:start|end)\s+[^{}]*\}",
        "",
        value,
        flags=re.IGNORECASE,
    )
    """Decode Folio prose while removing RTF formatting."""

    value = re.sub(
        r"\\'([0-9a-fA-F]{2})",
        lambda m: folio_encoding.decode_rtf_hex(m.group(1)),
        value
    )

    # Preserve semantic RTF paragraph/line boundaries with sentinels.
    # Physical newlines in the RTF file are only storage wrapping.
    value = re.sub(r"\\par\b ?", "\uFFF3", value)
    value = re.sub(r"\\line\b ?", "\uFFF4", value)
    value = re.sub(r"\\tab\b ?", " ", value)

    value = value.replace("\r\n", "")
    value = value.replace("\r", "")
    value = value.replace("\n", "")

    value = value.replace(r"\{", "\uFFF0")
    value = value.replace(r"\}", "\uFFF1")
    value = value.replace(r"\\", "\uFFF2")

    value = re.sub(r"\\[a-zA-Z]+-?\d*(?: )?", "", value)

    value = value.replace("{", "").replace("}", "")

    value = value.replace("\uFFF0", "{")
    value = value.replace("\uFFF1", "}")
    value = value.replace("\uFFF2", "\\")

    # Restore meaningful document structure after RTF cleanup.
    value = value.replace("\uFFF3", "\n\n")
    value = value.replace("\uFFF4", "\n")

    value = "\n".join(
        " ".join(line.split())
        for line in value.split("\n")
    )

    # Never allow more than one blank line between text blocks.
    value = re.sub(r"\n{3,}", "\n\n", value)

    return value.strip()


print("Reading complete VedaBase RTF...")
text = SOURCE.read_text(encoding="latin-1")

# Main/current NOD only. The separate 1970 edition is intentionally excluded.
start_match = re.search(
    r"\{\\v[^{}]*?\bNoD\s+Dedication\b",
    text,
    re.I
)

end_match = re.search(
    r"\{\\v[^{}]*?\bNoI\s+Preface\b",
    text,
    re.I
)

if not start_match:
    raise SystemExit("NOD Dedication marker not found")

if not end_match:
    raise SystemExit("NoI Preface marker not found")

if end_match.start() <= start_match.start():
    raise SystemExit("Invalid NOD source boundaries")

nod_text = text[start_match.start():end_match.start()]

marker_pattern = re.compile(
    r"\{\\v[^{}]*?\bNoD\s+"
    r"(Dedication|Preface(?:\\'97)?|Introduction|"
    r"\d+\s*:\s*[^{}\r\n]+)",
    re.I
)

markers = list(marker_pattern.finditer(nod_text))

print("NOD source start:", start_match.start())
print("NOD source end:", end_match.start())
print("Detected main-edition records:", len(markers))


def canonical_record(marker):
    raw = marker.group(1).strip()

    if raw.lower() == "dedication":
        return "NOD.Dedication", "Dedication"

    if raw.lower().startswith("preface"):
        return "NOD.Preface", "Preface"

    if raw.lower() == "introduction":
        return "NOD.Introduction", "Introduction"

    m = re.match(r"(\d+)\s*:\s*(.*)", raw)

    if not m:
        raise ValueError(f"Unrecognized NOD marker: {raw!r}")

    number = int(m.group(1))
    title = decode_general_text(m.group(2))

    return f"NOD.{number}", title


records = []

for i, marker in enumerate(markers):
    end = (
        markers[i + 1].start()
        if i + 1 < len(markers)
        else len(nod_text)
    )

    record_id, title = canonical_record(marker)

    # Start after the hidden Folio marker itself.
    raw_content = nod_text[marker.end():end]
    content = decode_general_text(raw_content)

    # The first visible paragraph repeats the record heading already
    # represented by id/title. Keep the body and internal headings intact.
    heading, separator, body = content.partition("\n\n")

    if not separator or not body.strip():
        raise ValueError(
            f"Could not separate visible heading from body for {record_id}: "
            f"{heading!r}"
        )

    records.append(
        {
            "id": record_id,
            "title": title,
            "content": body.strip(),
        }
    )


GENERATED = Path(__file__).with_name("generated")
GENERATED.mkdir(exist_ok=True)

OUTPUT = GENERATED / "nod-records.json"

OUTPUT.write_text(
    json.dumps(
        {
            "schema": "bhakti-study.folio-import.v1",
            "source": "Vedabase_2003_Complete.rtf",
            "edition": "main",
            "recordCount": len(records),
            "records": records,
        },
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)

print("\nNOD EXTRACTION")
print("--------------")
print("Records:", len(records))
print("First:", records[0]["id"] if records else "NONE")
print("Last:", records[-1]["id"] if records else "NONE")
print("With content:", sum(bool(r["content"]) for r in records))
print("Output:", OUTPUT)

print("\nRECORD SUMMARY")
print("--------------")
for record in records:
    print(
        f'{record["id"]:<18} '
        f'{len(record["content"]):>7} chars  '
        f'{record["title"]}'
    )
