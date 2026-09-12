# 12: Correct the matrix before committing it

**What to build:** The read-only matrix on the upload screen becomes editable. An Administrator can type a Unit Type code into any cell or clear it, rename a Storey in its row header, insert a Storey above or below a row (asked for its name) or a Stack left or right of a column (asked for its number), and remove either. Stack headers themselves are not editable. Below each Block the screen lists the Unit Type codes that will be created and any hard errors (a duplicate or blank Storey name, a duplicate Unit name in a Storey, no Block ticked), each pointing at its row or cell; Commit stays disabled while any remain. A Storey left with no filled cell is omitted at commit and the summary says so. Leaving the screen with an unsaved matrix asks for confirmation.

Underneath: the editor is a presentational component over a plain matrix value with `onChange`; the hard-error detection is a pure function beside the conversion from ticket 11, sharing the name-key and code-key rules. No server change: the commit route already refuses what the client misses.

Spec: `.scratch/projects/spec.md`, section "Unit Matrix upload". ADR-0006 applies.

**Blocked by:** 11 (Commit the previewed Blocks into an empty Project)

**Status:** complete

- [x] The editor renders a real table with editable Storey row headers, fixed Stack column headers and one labelled input per cell, and reports every change through `onChange`; story and test beside it
- [x] Cells can be changed and cleared; a Storey can be renamed; a Storey can be inserted above or below and a Stack left or right with a prompt for its name or number; either can be removed
- [x] Hard errors are detected by a unit-tested pure function and shown against their row or cell; Commit is disabled while any remain
- [x] The list of Unit Type codes to be created updates as cells change, using the whitespace-free code key
- [x] A Storey with no filled cell is omitted at commit and named in the summary
- [x] Leaving with an unsaved matrix asks for confirmation; every control is keyboard-operable
- [x] The e2e spec covers cell edit and clear, Storey rename, inserting and removing a Storey and a Stack, a duplicate Unit name blocking Commit, the updated Unit Type list, and a commit after edits
- [x] All copy exists in both locales

## Comments

Implemented in an isolated worktree. Pending main-agent review and combined integration verification.

Targeted checks: 12 pure/component tests; 3 new editor browser scenarios and 7 existing upload/commit scenarios passed in Chromium. TypeScript, changed-source ESLint, and Vite build passed. See `.scratch/projects/verification/ticket-12.md` for evidence and limitations.

Parent integration: standards/spec review complete. Combined root lint/typecheck/tests pass and all 30 editor/upload/commit browser cases pass across Chromium, Firefox and WebKit with normal workspace fonts. Unit editing, parser warnings, selection normalization and immutable import/omission summaries are preserved.
