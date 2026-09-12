import { read, utils, type WorkSheet, type CellObject } from "xlsx";
import { nameKey } from "@/lib/name-key.js";
import { HttpError } from "@/lib/http-error.js";
import type {
	UnitMatrixBlock,
	UnitMatrixPreview,
} from "@/schemas/unit-matrix.schema.js";

function unreadable(): HttpError {
	return new HttpError(
		400,
		"This file could not be read as an Excel workbook.",
		{ code: "UNIT_MATRIX_UNREADABLE" }
	);
}
function label(value: string): string {
	return /^\d+(?:\.0+)?$/.test(value)
		? String(Number(value)).padStart(2, "0")
		: value.replace(/\s+/g, " ");
}
function parseSheet(sheet: WorkSheet): Array<UnitMatrixBlock> {
	// Bound work by actual populated cells, never the untrusted !ref rectangle.
	const addresses = Object.keys(sheet).filter((key) => /^[A-Z]+\d+$/.test(key));
	if (addresses.length > 200_000) throw unreadable();
	const positions = addresses.map((address) => utils.decode_cell(address));
	const endRow = positions.reduce((end, cell) => Math.max(end, cell.r), 0);
	const endColumn = positions.reduce((end, cell) => Math.max(end, cell.c), 0);
	if ((endRow + 1) * (endColumn + 1) > 2_000_000) throw unreadable();
	const mergedAway = new Set<string>();
	const headerEnds = new Map<string, number>();
	let mergeWork = 0;
	for (const range of sheet["!merges"] ?? []) {
		mergeWork += (range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1);
		if (
			mergeWork > 2_000_000 ||
			range.e.r > endRow + 100 ||
			range.e.c > endColumn + 100
		)
			throw unreadable();
		if (range.e.c > range.s.c)
			headerEnds.set(utils.encode_cell(range.s), range.e.c);
		for (let r = range.s.r; r <= range.e.r; r++)
			for (let c = range.s.c; c <= range.e.c; c++) {
				if (r !== range.s.r || c !== range.s.c)
					mergedAway.add(utils.encode_cell({ r, c }));
			}
	}
	// Searching delayed Storeys is also bounded across all candidate headers.
	let lookups = 0;
	const value = (r: number, c: number): string => {
		if (++lookups > 10_000_000) throw unreadable();
		const address = utils.encode_cell({ r, c });
		if (mergedAway.has(address)) return "";
		const cell = sheet[address] as CellObject | undefined;
		return cell?.v === undefined || cell.t === "e" ? "" : String(cell.v).trim();
	};
	const blocks: Array<UnitMatrixBlock> = [];
	const claimed = new Set<string>();
	const ordered = positions.sort((a, b) => a.r - b.r || a.c - b.c);
	for (const header of ordered) {
		const name = value(header.r, header.c);
		if (!name || /^\d+$/.test(name)) continue;
		const mergedEnd = headerEnds.get(utils.encode_cell(header));
		if (
			mergedEnd === undefined &&
			(value(header.r, header.c + 1) ||
				(header.c > 0 && value(header.r, header.c - 1)))
		)
			continue;
		for (const offset of [1, 2, 3, 4, 0]) {
			let stackRow = header.r + offset;
			const inferred = offset === 0;
			const columns: Array<number> = [];
			if (inferred) {
				// Without printed stack numbers, require a bounded header and two adjacent
				// labelled rows containing type codes. This excludes notes and count legends.
				if (
					mergedEnd === undefined ||
					header.c === 0 ||
					value(header.r, header.c - 1)
				)
					continue;
				for (let c = header.c; c <= mergedEnd; c++) columns.push(c);
				let inferredRow = -1;
				for (
					let r = header.r + 1;
					r <= Math.min(header.r + 4, endRow - 1);
					r++
				) {
					const isStorey = (row: number): boolean =>
						/^(?:\d+(?:\.0+)?|B\d+|G|M)$/i.test(value(row, header.c - 1));
					if (
						isStorey(r) &&
						isStorey(r + 1) &&
						[r, r + 1].every((row) =>
							columns.some((c) => /[a-z]/i.test(value(row, c)))
						) &&
						columns.filter((c) => value(r, c) || value(r + 1, c)).length >= 2
					) {
						inferredRow = r;
						break;
					}
				}
				if (inferredRow < 0) continue;
				stackRow = inferredRow - 1;
			} else {
				for (let c = header.c; c <= (mergedEnd ?? endColumn); c++) {
					if (!/^\d+$/.test(value(stackRow, c))) break;
					columns.push(c);
				}
				if (
					columns.length < 2 ||
					(mergedEnd !== undefined && columns.at(-1) !== mergedEnd)
				)
					continue;
			}
			const numbers = columns.map((c, index) =>
				inferred ? index + 1 : Number(value(stackRow, c))
			);
			const warnings: UnitMatrixBlock["warnings"] = [];
			if (inferred)
				warnings.push({
					code: "INFERRED_STACKS",
					message: "No stack row was found; columns were numbered from 1.",
				});
			if (
				numbers.some(
					(number, index) => index > 0 && number !== numbers[index - 1]! + 1
				)
			) {
				warnings.push({
					code: "NON_CONSECUTIVE_STACKS",
					message:
						"Stack numbers are not consecutive; the workbook numbers were kept.",
				});
			}
			const identity = `${stackRow}:${header.c}`;
			if (claimed.has(identity)) break;
			// Other Blocks' stack columns cannot be mistaken for a shared Storey column.
			let storeyColumn = -1;
			let firstRow = -1;
			for (let c = header.c - 1; c >= 0; c--) {
				if (/^\d+$/.test(value(stackRow, c))) continue;
				for (let r = stackRow + 1; r <= endRow; r++) {
					// A lower band owns its own labels, even when this Block starts late.
					if (
						headerEnds.has(utils.encode_cell({ r, c: header.c })) &&
						[1, 2, 3, 4].some((offset) =>
							columns.every((column) => /^\d+$/.test(value(r + offset, column)))
						)
					)
						break;
					if (
						value(r, c) &&
						!/^(?:unit|flr|floor|storey)$/i.test(value(r, c))
					) {
						storeyColumn = c;
						firstRow = r;
						break;
					}
				}
				if (storeyColumn >= 0) break;
			}
			if (storeyColumn < 0) continue;
			const storeys: UnitMatrixBlock["storeys"] = [];
			const seenStoreys = new Set<string>();
			let emptyTailOnly = false;
			for (let r = firstRow; r <= endRow; r++) {
				if (!value(r, storeyColumn)) {
					// One alignment spacer may precede empty ground/basement labels.
					// It never permits later filled rows (schematics/counts) back into the grid.
					if (
						!emptyTailOnly &&
						columns.every((c) => !value(r, c) && !value(r + 1, c)) &&
						/^(?:\d+(?:\.0+)?|B\d+|G|M)$/i.test(value(r + 1, storeyColumn))
					) {
						emptyTailOnly = true;
						continue;
					}
					break;
				}
				if (emptyTailOnly && columns.some((c) => value(r, c))) break;
				const originalLabel = value(r, storeyColumn);
				const storeyKey = nameKey(label(originalLabel));
				if (seenStoreys.has(storeyKey)) {
					warnings.push({
						code: "DUPLICATE_STOREY",
						label: originalLabel,
						message: `The later row labelled ${originalLabel} was omitted because that Storey already appeared.`,
					});
					continue;
				}
				seenStoreys.add(storeyKey);
				const cells = columns.map(
					(c) => value(r, c).replace(/\s+/g, " ") || null
				);
				if (cells.every((cell) => cell === null)) {
					warnings.push({
						code: "EMPTY_STOREY",
						label: value(r, storeyColumn),
						message: `Storey ${value(r, storeyColumn)} was omitted because it has no Units.`,
					});
					continue;
				}
				storeys.push({ name: label(value(r, storeyColumn)), cells });
			}
			if (storeys.length === 0)
				warnings.push({
					code: "EMPTY_BLOCK",
					message: "This Block has no Units; review it before including it.",
				});
			blocks.push({
				name: name.replace(/\s+/g, " "),
				stacks: numbers.map((number) => label(String(number))),
				storeys: storeys.reverse(),
				unitCount: storeys.reduce(
					(sum, storey) =>
						sum + storey.cells.filter((cell) => cell !== null).length,
					0
				),
				warnings,
			});
			claimed.add(identity);
			break;
		}
	}
	return blocks;
}
/** Stateless workbook parsing; formulas are read only through their cached values. */
export function parseUnitMatrix(buffer: Buffer): UnitMatrixPreview {
	// SheetJS also reads CSV/plain text. Only Excel container signatures are accepted.
	const compound = buffer
		.subarray(0, 8)
		.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
	const zip = buffer
		.subarray(0, 4)
		.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
	if (!compound && !zip) throw unreadable();
	try {
		const workbook = read(buffer, {
			type: "buffer",
			cellFormula: false,
			cellHTML: false,
			cellStyles: false,
			bookVBA: false,
		});
		if (workbook.SheetNames.length === 0 || workbook.SheetNames.length > 100)
			throw unreadable();
		return {
			sheets: workbook.SheetNames.map((name) => ({
				name,
				blocks: parseSheet(workbook.Sheets[name]!),
				warnings: [],
			})),
		};
	} catch {
		throw unreadable();
	}
}
