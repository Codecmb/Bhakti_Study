"""Legacy Bhaktivedanta VedaBase/Folio transliteration decoding."""

FOLIO_TRANSLITERATION_MAP = {
    "e0": "ṁ",
    "e4": "ā",
    "e5": "ṛ",
    "e7": "ś",
    "e8": "ṝ",
    "e9": "ī",
    "eb": "ṇ",
    "ec": "ṅ",
    "ef": "ñ",
    "f1": "ṣ",
    "f2": "ḍ",
    "f6": "ṭ",
    "f9": "ḥ",
    "fb": "n",
    "fc": "ū",
    "ff": "ḷ",
    "92": "’",
}

# General Folio/RTF text decoding.
# Standard RTF hex escapes use the Windows-1252 character set.
# Sanskrit transliteration characters are subsequently normalized
# with the proven Folio legacy mapping where applicable.

FOLIO_PROSE_MAP = {
    # Legacy Sanskrit-Times encoding found in VedaBase prose.
    "80": "ā",
    "83": "ḥ",
    "85": "ī",
    "88": "ṁ",
    "89": "ṅ",
    "8a": "ṇ",
    "8e": "ṭ",
    "98": "ṭ",
    "ae": "Ś",
    "b5": "Ṭ",
    "99": "ū",
    "81": "ḍ",
    "8d": "ṛ",
    "8f": "ś",
    "90": "ṣ",

    # Uppercase transliteration characters.
    "c7": "Ś",
    "c9": "Ī",
    "d1": "Ṣ",
    "d2": "Ḍ",
    "d6": "Ṭ",
    "dc": "Ū",
}


def decode_rtf_hex(code):
    code = code.lower()

    if code in FOLIO_PROSE_MAP:
        return FOLIO_PROSE_MAP[code]

    if code in FOLIO_TRANSLITERATION_MAP:
        return FOLIO_TRANSLITERATION_MAP[code]

    try:
        return bytes([int(code, 16)]).decode("cp1252")
    except (ValueError, UnicodeDecodeError):
        return f"[UNMAPPED:{code}]"
