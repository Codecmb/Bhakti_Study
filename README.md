# Academia Master Siddhānta Gauḍīya — Bhakti Study

Bhakti Study is a self-contained, modular śāstra-study environment designed around the academic progression:

**Study → Remember → Realize**

The Academy combines canonical source reading, structured courses, study questions, personal study work, assessments, progress tracking, reference resources and Academy completion certificates while keeping authoritative source material separate from student-created work.

---

## 1. Academy Programs

The application currently includes:

- **Bhakti Śāstrī**
  - Bhagavad-gītā
  - Śrī Īśopaniṣad
  - Nectar of Instruction
  - Nectar of Devotion

- **Bhakti Vaibhava**
  - Śrīmad-Bhāgavatam Cantos 1–6

- **Bhakti Vedānta**
  - Śrīmad-Bhāgavatam Cantos 7–12

- **Bhakti Sārvabhauma**
  - Caitanya-caritāmṛta Ādi-līlā
  - Caitanya-caritāmṛta Madhya-līlā
  - Caitanya-caritāmṛta Antya-līlā

- **Ṣaṭ Sandarbhas**
  - Tattva Sandarbha
  - Bhagavat Sandarbha
  - Paramātma Sandarbha
  - Kṛṣṇa Sandarbha
  - Bhakti Sandarbha
  - Prīti Sandarbha

The four principal course programs contain **536 structured lessons**.

---

# 2. Starting Bhakti Study on This Computer

The current installation is located at:

    ~/Downloads/Bhakti_Study_TEST

A desktop launcher has already been configured.

Open **Academia Master** from the computer's application menu.

The launcher:

1. Opens the Bhakti Study application directory.
2. Checks whether the local Academy server is already running.
3. Starts a Python HTTP server on port `8080` if necessary.
4. Opens Firefox automatically.

The local Academy address is:

    http://127.0.0.1:8080/index.html

The current launcher is:

    ~/.local/bin/academia-master

The desktop application entry is:

    ~/.local/share/applications/academia-master.desktop

---

# 3. Manual Startup

If the desktop launcher is unavailable, the Academy can be started manually.

Open a terminal and run:

    cd ~/Downloads/Bhakti_Study_TEST
    python3 -m http.server 8080 --bind 127.0.0.1

Then open:

    http://127.0.0.1:8080/index.html

Keep the terminal running while using the Academy.

---

# 4. Main Navigation

The Academy sidebar provides access to:

- Academy Home
- Bhakti Śāstrī
- Bhakti Vaibhava
- Bhakti Vedānta
- Bhakti Sārvabhauma
- Ṣaṭ Sandarbhas
- Books & Library
- References & Further Study
- Śloka Lab
- My Work
- My Progress
- Certificates
- Manage Academy

The sidebar is the primary navigation system.

Course-specific navigation remains inside each course and does not replace the main Academy navigation.

---

# 5. Course Structure

The principal courses follow:

**Unit → Chapter → Lessons**

Units are collapsed by default.

Opening one unit closes the other units.

Inside an open unit, lessons are organized into chapter sections.

Opening one chapter closes the other chapters.

Lesson cards appear inside the currently opened chapter.

Lessons represent study assignments and canonical reference ranges rather than duplicated copies of scripture.

---

# 6. Studying a Lesson

Open a course and select:

1. Unit
2. Chapter
3. Lesson

The study workspace provides tools appropriate to the course, including:

- Read Source
- My Understanding
- Study Questions
- My Questions
- Notes
- Assessment
- Progress

Bhakti Śāstrī also provides integration with Śloka Lab.

The intended study cycle is:

**Read → Understand → Question → Reflect → Assess → Progress**

---

# 7. Canonical Source Reading

Bhakti Study follows the principle:

**One source of truth, many uses.**

Scriptural text is stored in the canonical Library/source layer.

Courses reference that material through stable canonical references rather than maintaining independent copies of the same scripture.

This allows:

- readers,
- lessons,
- questions,
- progress,
- assessments,
- study tools,
- references

to work from the same canonical identity.

Do not duplicate canonical scripture into individual course modules when a canonical source already exists.

---

# 8. Books & Library

Use **Books & Library** to access canonical source material independently of a course.

The Academy contains canonical source collections for:

- Bhagavad-gītā
- Śrī Īśopaniṣad
- Nectar of Devotion
- Nectar of Instruction
- Śrīmad-Bhāgavatam
- Caitanya-caritāmṛta
- Sandarbha study sources where available

Different source families may use different readers.

The Academy intentionally does not force every book into one universal reader.

---

# 9. My Understanding

**My Understanding** is the student's personal explanation of the material being studied.

It is student work and is kept separate from authoritative source material.

Use it to summarize and articulate the siddhānta of the lesson after studying the primary source.

---

# 10. Study Questions

Study Questions are part of the Academy's academic study system.

Questions should test and reinforce siddhānta taught by the ācāryas rather than functioning only as general reflection prompts.

Where available, question provenance and source grounding are preserved.

---

# 11. My Questions

**My Questions** allows students to create and preserve their own questions while studying.

Student-created questions remain separate from official or Academy-provided question banks.

They are connected to the student's work rather than inserted into canonical source material.

---

# 12. Notes

Notes provide a place for personal study observations.

Notes are student data and do not modify canonical scripture or Academy source material.

---

# 13. Assessments

Where Academy completion requirements are configured, the Assessment tool records the requirements for completing an Academy unit.

For Bhakti Śāstrī, the configured requirements currently include:

- completing the assigned primary reading,
- answering the study questions from the source,
- reviewing the required ślokas,
- revising My Understanding after rereading the source.

All configured requirements must be satisfied before the unit can be marked complete.

Bhakti Vaibhava, Bhakti Vedānta and Bhakti Sārvabhauma currently retain their official framework information separately, but Academy unit-completion requirements have not yet been configured for those programs.

Official framework requirements must not automatically be converted into Academy completion requirements.

---

# 14. My Progress

Use **My Progress** to see Academy completion status.

For programs with configured Academy completion rules, the page displays:

- completed Academy units,
- total trackable units,
- completion percentage,
- assessment-check totals.

Example:

    1/5 Academy units complete · 20%

Progress is calculated from the Academy's stored student completion state.

---

# 15. Certificates

The **Certificates** page is connected to Academy completion status.

A certificate can only be previewed when:

- Academy completion rules are configured for the selected program, and
- all trackable Academy units are complete.

The certificate uses the student's entered name only to render the certificate.

The certificate module does not intentionally store that name as course progress.

### Important

These are:

**Academy Completion Certificates**

They are **not** official ISKCON/BOEX śāstric degrees.

Official degrees require the applicable approved examination-center process.

---

# 16. Study Guides

Course Study Guides are available through the individual course pages.

Study Guides are program-aware and remain separated by course.

The administrator can manage Academy Study Guides through:

**Manage Academy → Study Guides**

Study Guides may contain:

- assigned references,
- lesson guidance,
- study questions,
- instructor material,
- source connections.

---

# 17. Śloka Lab

Śloka Lab is a supplementary study system for memorization and review.

Bhakti Śāstrī can connect required śloka references to Śloka Lab.

The Academy does not maintain a duplicate copy of the separate Śrīla Prabhupāda Ślokas audio database.

The separate Śrīla Prabhupāda Ślokas project remains an independent project.

---

# 18. References & Further Study

Use **References & Further Study** for supplementary scholarly resources.

This section is intentionally separate from the primary study workspace so that course pages remain focused.

It may include:

- registered Gauḍīya scholars,
- optional commentaries,
- Academy references,
- comparative philosophy resources.

Supplementary resources do not replace the Academy's canonical primary sources.

Non-Prabhupāda material should preserve visible attribution to its author or source.

---

# 19. Ṣaṭ Sandarbhas

The Ṣaṭ Sandarbhas operate as an advanced siddhānta study layer.

The Sandarbhas preserve their own reader/study architecture rather than being forced into the same reader used by every other course.

Where canonical source resolution is available, the Academy connects Sandarbha study references to the appropriate source.

Known unresolved source boundaries must remain explicit rather than being silently filled with invented material.

---

# 20. Manage Academy

Use **Manage Academy** for administrative functions.

Available management functions include Academy tools such as:

- Study Guides
- References
- supported import workflows

Administrative additions must remain distinguishable from canonical or officially sourced material.

---

# 21. Importing Study Material

Bhakti Study includes modular import tooling.

Supported study/question import workflows may accept formats including:

- CSV
- TXT
- Markdown
- RTF
- PDF

Imported material should preserve, where applicable:

- source title,
- author,
- provenance,
- program association,
- canonical reference information.

Preview imported material before permanently incorporating it into Academy study data.

---

# 22. Student Portfolio / My Work

**My Work** provides access to student-created academic work.

Student work is stored separately from canonical source material.

The student system includes support for work such as:

- understanding responses,
- questions,
- notes,
- study drafts,
- progress-related work.

Where available, student work can be exported for backup or review.

---

# 23. Student Data and Browser Storage

A significant portion of personal student state is stored in the browser.

This may include:

- notes,
- questions,
- understanding responses,
- assessment state,
- completion state,
- other student workspace data.

Clearing browser site data may erase browser-local student information.

Do not clear Firefox site data for the Academy unless the student information has been backed up or is no longer needed.

---

# 24. Backup and Restore

Use the Academy's available export/backup functions to preserve student work.

Student data and canonical Academy source files are different things:

**Repository files**
contain the Academy application, courses and canonical data.

**Browser-local student data**
contains personal study work and progress.

Backing up the application directory alone does not necessarily back up browser-local student progress.

---

# 25. PWA / Installable Application

Bhakti Study contains:

- `manifest.webmanifest`
- `service-worker.js`
- Academy application icons

These provide the foundation for Progressive Web App behavior.

The current computer installation runs from:

    http://127.0.0.1:8080/

This address is local to the computer.

### Phone installation

A phone cannot use the computer's `127.0.0.1` address as the Academy server.

For normal phone installation, Bhakti Study should be served from an HTTPS-accessible location such as a properly configured web host or GitHub Pages deployment.

Once the Academy is available from an appropriate HTTPS address, the phone browser can use its normal **Add to Home Screen / Install App** function.

Do not assume that publishing the repository and installing the application are the same operation. Verify the deployed PWA before relying on it for student work.

---

# 26. Offline Use

The Academy includes a service worker and shell caching for core navigation.

Offline behavior depends on which resources have already been cached and which study resources require network access.

Do not assume every book, external reference or external media resource is available offline unless it has been explicitly tested.

---

# 27. Source and Attribution Rules

Bhakti Study follows strict source discipline.

### Primary rules

1. Do not silently invent missing source text.
2. Do not replace canonical material with unsourced summaries.
3. Preserve author attribution.
4. Clearly identify non-Prabhupāda material.
5. Preserve source provenance when importing material.
6. Keep student work separate from authoritative sources.
7. Use internal canonical sources first when available.
8. External resources supplement rather than replace the Academy Library.
9. Preserve known source gaps until an authoritative source is supplied.

---

# 28. Modular Architecture

The Academy is designed to remain plug-and-play.

Shared systems should be implemented once and reused.

Examples include:

- Student Portfolio
- export/import
- question systems
- readers
- progress
- study tools
- bibliography/references
- canonical source resolution

Courses consume shared capabilities through stable interfaces and configuration rather than duplicating the same system separately.

New modules should be independently addable or removable without breaking unrelated functionality.

---

# 29. Modular Course Data

Bhakti Vaibhava, Bhakti Vedānta and Bhakti Sārvabhauma load course data through:

    data/course-manifest.json

with modular course shards.

`shared/program-data.js` merges those modules at runtime.

Legacy `course.json` files may remain as compatibility snapshots and should not automatically be treated as the active runtime source.

---

# 30. Canonical Source Index

Canonical source data is organized in modular source shards.

The Academy resolves references through the canonical source system rather than requiring each course to contain its own copy of source text.

This supports the governing architecture:

**One source of truth, many uses.**

---

# 31. Troubleshooting

## Academy does not open

Try:

    cd ~/Downloads/Bhakti_Study_TEST
    python3 -m http.server 8080 --bind 127.0.0.1

Then open:

    http://127.0.0.1:8080/index.html

## Port 8080 is already in use

Check whether the Academy is already open in Firefox before starting another server.

## Changes do not appear

Refresh the browser.

Because the application uses browser caching and a service worker, development changes may occasionally require a stronger refresh or service-worker/cache inspection.

Do not clear all browser site data if student work has not been backed up.

## Progress appears incorrect

Check the corresponding course Assessment page first.

Academy unit completion depends on the configured assessment requirements and the unit being marked complete.

## Certificate button is disabled

Open **My Progress**.

The certificate remains unavailable until the selected program has configured Academy completion rules and all trackable units are complete.

---

# 32. Important Files

Application entry:

    index.html

Shared application modules:

    shared/

Canonical/source data:

    data/

Programs:

    programs/

Library:

    library/

Student workspace:

    student/

Certificates:

    certificates/

References:

    references/

Administration:

    admin/

PWA configuration:

    manifest.webmanifest
    service-worker.js

Academy logo and icons:

    assets/

---

# 33. Development Principle

When modifying Bhakti Study:

- make the smallest isolated change necessary,
- preserve existing working functionality,
- preserve reader boundaries,
- avoid duplicate canonical data,
- do not alter unrelated UI,
- preserve provenance,
- preserve stable identifiers,
- keep shared capabilities modular,
- test the actual browser behavior after implementation.

---

# 34. Known Source Status

Known source limitations should be treated as source-management issues rather than silently repaired with invented content.

Consult the Academy's source-audit data where applicable.

In particular:

- some Sandarbha source boundaries remain unresolved,
- supplied source coverage varies by work,
- imported or supplementary material must retain provenance.

---

# 35. Separate Śrīla Prabhupāda Ślokas Project

The Śrīla Prabhupāda Ślokas application/audio project is separate from Bhakti Study.

Bhakti Study may reference that project where appropriate, but the two applications should not be treated as one repository or one canonical database.

---

# Summary

Bhakti Study is designed as a modular academic environment in which:

**canonical sources remain authoritative,
courses organize study,
shared tools support learning,
student work remains independent,
progress records Academy completion,
and provenance remains visible.**

The guiding principle is:

> **One source of truth, many uses.**
