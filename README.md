# Academia Master Siddhānta Gauḍīya — Bhakti Study

Final consolidated modular application build.

## Included
- Bhakti Śāstrī — Bhagavad-gītā, Śrī Īśopaniṣad, Nectar of Instruction, Nectar of Devotion
- Bhakti Vaibhava — Śrīmad-Bhāgavatam Cantos 1–6
- Bhakti Vedānta — Śrīmad-Bhāgavatam Cantos 7–12
- Bhakti Sārvabhauma — Caitanya-caritāmṛta Ādi, Madhya, Antya
- Ṣaṭ Sandarbhas — advanced independent siddhānta track
- Reference Library, generic reader, progress, study/reflection layer
- Śrīla Prabhupāda Ślokas provider integration (reference-based, no duplicate verse/audio database)
- Academy Completion Certificate generator with render-only student name
- Multi-format import tooling and source/edition manifests
- PWA shell cache for core navigation

## Architecture
Books are replaceable. Courses are configurable. References attach to canonical IDs. Student data remains independent. Source-local numbering and Academy canonical identity are separate.

## Official-degree boundary
This independent application can organize study according to published Ministry/BOEX standards, but its certificate is an **Academy Completion Certificate**, not an official ISKCON/BOEX śāstric degree. Official degrees require the applicable approved examination-center process.

## Known source-status items
See `data/final-source-audit.json`. In particular, do not silently fill source gaps or change source attribution.

## Cleanup
This ZIP supersedes prior generated Bhakti Study ZIP builds. Keep original source archives/books/documents and the separate Śrīla Prabhupāda Ślokas project/repository.

## Interaction + visual repair
- Vibrant devotional UI palette applied globally (peacock blue, turquoise, saffron, lotus, violet, gold).
- Bhakti Śāstrī study actions are real routes/buttons rather than descriptive text.
- Required śloka pills route to Śloka Lab by normalized reference.
- Śloka Lab reads the separate `Codecmb/srila-prabhupada-slokas` GitHub dataset live when online; the course does not duplicate the verse/audio database.
- Primary reader accepts `?ref=` deep links and opens the matching verse when present.
- Academy Understanding, Questions, Notes, Assessment, and Progress routes are functional and browser-local.

## Modular data registry
Canonical source data is sharded under `data/sources/canonical-index/` by book/canto/lila. Question data is sharded under each program's `data/questions/` by provider and scope. Runtime code loads only the shard required for the active canonical reference. Legacy monolithic JSON files remain temporarily as deprecated migration aliases and are not used by the updated Bhakti Sastri workspace.


## Modular course JSON
Bhakti Vaibhava, Bhakti Vedanta, and Bhakti Sarvabhauma now load course data through `data/course-manifest.json` and small shards in `data/course/`. `shared/program-data.js` merges modules at runtime. The former `course.json` files remain compatibility snapshots only and are not used by those program pages.
