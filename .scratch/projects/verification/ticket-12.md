# Ticket 12 verification

Implemented the controlled `UnitMatrixEditor`, labelled Storey/cell inputs, fixed Stack headers, prompted row/column insertion and removal, inline validation, and per-Block new Unit Type lists. Validation and conversion share the same padded Stack Unit names and frontend name-key function; code deduplication follows ADR-0006 (uppercase, no whitespace, first spelling retained).

The page stores previews and edits independently of the parse mutation. Sheet switches and selected replacement files retain edits. Replacing an existing preview requires confirmation; a failed replacement retains the original matrix. Router navigation and browser unload protect unsaved matrices, and only successful commit bypasses protection.

Cleared/whitespace-only Storeys are omitted. Their Block / Storey labels are captured in route search alongside the existing count snapshots, and preserved during selection normalization and manual selection. Browser verification renames the imported Block afterward and confirms that original omission labels and counts remain unchanged.

## Targeted evidence

- Red/green pure validation check: padded `1` / `01` collisions, normalized duplicate Storeys, blank Storeys, and no selected Blocks.
- `vitest run src/features/projects/matrix-to-structure.test.ts src/features/projects/UnitMatrixEditor.test.tsx src/features/projects/UnitMatrixAccordion.test.tsx src/features/projects/UnitMatrixTable.test.tsx`: **12 passed**. This includes code qualifier preservation, existing-type reuse keys, omission conversion, invalid names/codes, controlled changes, keyboard-triggered insertion, row/column alignment, and unchanged translated warning behavior.
- `e2e/unit-matrix-editor.spec.ts`: **3 Chromium scenarios passed**. They cover edits/clears/rename, above/left insertion and removal, duplicate Units blocking Commit, updating deduplicated types, corrected commit, immutable omission summary after manual edits, sheet retention, cancelled and failed replacement, navigation cancellation/acceptance, blank/duplicate Storeys and no Blocks selected.
- Existing `e2e/unit-matrix-upload.spec.ts` and `e2e/structure-commit.spec.ts`: **7 Chromium scenarios passed**, including the phone matrix scroll boundary and successful commit navigation without an unsaved prompt.
- Changed-source ESLint, `tsc --noEmit`, and Vite production build passed. Source lint and TypeScript were rechecked after final summary preservation changes.
- Both locale files include the new copy. zh-CN retains its existing machine-translation review flag.

Local browser checks used a temporary isolated port configuration (removed). The shared dependency symlinks caused Vite to reject font asset requests in this worktree, so those runs used fallback fonts. Main-workspace combined checks and all-browser verification remain the integration owner's responsibility; no database or backend changes were required.

No original workbooks were copied, and no files were staged or committed.
