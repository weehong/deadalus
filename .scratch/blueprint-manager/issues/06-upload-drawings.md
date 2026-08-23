# 06: Upload drawings

**What to build:** On the Upload drawings screen the Administrator drops files or picks files or a whole folder (PDF, DWG, DXF, RVT; accepted formats and the real size limit stated; no cap on count). Each file appears in a queue (document, size, discipline, status with live progress) and uploads through the resumable protocol to the drawings bucket with retry on failure, remove while queued, and "Clear finished". A batch card shows documents, total size and uploaded-so-far. On completion a drawing row is recorded against the Site with name, size, discipline (parsed from the sheet-code prefix, else Unassigned) and revision (parsed from a trailing "rev X" if present); the sidebar foot count and size update. The copy says an unfinished upload is dropped on reload. A "Next step" card points to Building structure.

**Blocked by:** 02 (Database schema and seed, and the Building structure screen (read))

**Status:** complete (Playwright coverage written; host browsers unavailable)

- [ ] Drop zone, file picker and folder picker; accepted types and real size limit stated
- [ ] In-memory queue with per-file progress, failed + retry, remove while queued, Clear finished; batch summary card
- [ ] Resumable uploads (new dependency) to the drawings bucket keyed by Site/id/filename; drawing row inserted on completion
- [ ] Discipline and revision parsing as a pure function with a table test
- [ ] Sidebar foot drawing count/size reflects new rows; Next step card links to structure
- [ ] Unit tests: queue rows by props, parsing table, summary derivation
- [ ] End-to-end (written): storage + REST intercepted — a picked file sends resumable requests then the insert, queue reaches Uploaded
- [ ] Strings in both locales; lint, typecheck, unit tests and build green
