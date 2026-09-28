# Academy Lesson Architecture

The Academy uses one curriculum pattern across Bhakti Śāstrī, Bhakti Vaibhava, Bhakti Vedānta, and Bhakti Sārvabhauma:

**Course → Unit → Lesson Outline → Canonical Passage → Study Workflow → Assessment → Progress**

## Source rule
Lesson records never copy scripture. They store canonical-library pointers (`book`, `firstRef`, `lastRef`) plus curriculum metadata. Scripture remains owned by `library/books/` and is rendered by the shared reader.

## Shared behavior
`shared/course-home.js` renders every course from its manifest and `course/lessons.json`. The same lesson cards open the canonical reader and the existing shared study tools. The reader returns to the active course/unit and exposes understanding, questions, notes, assessment, and other student actions.

## Flexibility
Lesson outlines are data, not hard-coded pages. A course can change lesson boundaries, add pedagogical metadata, or gain another language/edition without changing the shared Academy engine or duplicating scripture.

## Current lesson inventory
- Bhakti Śāstrī: 99 lessons
- Bhakti Vaibhava: 138 lessons
- Bhakti Vedānta: 120 lessons
- Bhakti Sārvabhauma: 62 lessons

These are generated from the currently available canonical internal sources and existing course-unit boundaries. They are designed to be refined pedagogically without changing the reader or canonical library.

## Curriculum refinement — passage-level lesson outlines

The Academy lesson layer follows the Bhakti-sastri study-outline pattern: lessons are pedagogical passage ranges, not merely whole-book chapters. Bhagavad-gita uses the published Gauranga Bhakti-sastri homework section ranges. Nectar of Devotion is limited to the Bhakti-sastri prescribed Chapters 1–19 and grouped into 12 lessons. Sri Isopanisad + Nectar of Instruction are grouped into 14 lessons. Bhakti Vaibhava and Bhakti Vedanta use the same passage-level pattern while keeping normal multi-chapter units near a 10–15 lesson rhythm where the source permits. Bhakti Sarvabhauma preserves chapter-level lessons where the existing lila units already contain many chapters. All lesson records point to canonical source IDs; no scripture is duplicated in lesson data.
