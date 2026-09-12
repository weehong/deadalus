import { describe, expect, it } from "vitest";
import { utils, write, type WorkSheet } from "xlsx";
import { parseUnitMatrix } from "@/services/unit-matrix.js";

function workbook(
	sheet: WorkSheet,
	bookType: "xlsx" | "biff8" = "xlsx"
): Buffer {
	const book = utils.book_new();
	utils.book_append_sheet(book, sheet, "Schedule");
	utils.book_append_sheet(book, utils.aoa_to_sheet([["Notes only"]]), "Notes");
	return write(book, { type: "buffer", bookType }) as Buffer;
}
describe("Unit Matrix workbook parser", () => {
	it.each(["xlsx", "biff8"] as const)(
		"reads a plain %s workbook, preserving labels and lowest Storey first",
		(bookType) => {
			const sheet = utils.aoa_to_sheet([
				[null, "  Orchard   North  "],
				["Storey", 1, 2],
				[2, " A1 ", "BP2(p) (M)"],
				["G", "C1", null],
			]);
			sheet["!merges"] = [utils.decode_range("B1:C1")];
			expect(parseUnitMatrix(workbook(sheet, bookType))).toEqual({
				sheets: [
					{
						name: "Schedule",
						blocks: [
							{
								name: "Orchard North",
								stacks: ["01", "02"],
								storeys: [
									{ name: "G", cells: ["C1", null] },
									{ name: "02", cells: ["A1", "BP2(p) (M)"] },
								],
								unitCount: 3,
								warnings: [],
							},
						],
						warnings: [],
					},
					{ name: "Notes", blocks: [], warnings: [] },
				],
			});
		}
	);
});
it("reads side-by-side Blocks sharing a Storey column, cached formula labels and a merged Unit", () => {
	const sheet = utils.aoa_to_sheet([
		[null, null, "West", null, null, "East"],
		["Storey", null, 1, 2, null, 3, 4],
		[2, null, "PH", null, null, "B1", "B2"],
		[1, null, "A1", "A2", null, "B1", "B2"],
	]);
	sheet["A3"] = { t: "n", f: "SUM(A4,1)", v: 2 };
	sheet["!merges"] = [
		utils.decode_range("C1:D1"),
		utils.decode_range("F1:G1"),
		utils.decode_range("C3:D3"),
	];
	const blocks = parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks;
	expect(blocks).toEqual([
		{
			name: "West",
			stacks: ["01", "02"],
			storeys: [
				{ name: "01", cells: ["A1", "A2"] },
				{ name: "02", cells: ["PH", null] },
			],
			unitCount: 3,
			warnings: [],
		},
		{
			name: "East",
			stacks: ["03", "04"],
			storeys: [
				{ name: "01", cells: ["B1", "B2"] },
				{ name: "02", cells: ["B1", "B2"] },
			],
			unitCount: 4,
			warnings: [],
		},
	]);
});
it("rejects loose text and malicious sparse dimensions as unreadable", () => {
	expect(() => parseUnitMatrix(Buffer.from("not a workbook"))).toThrow(
		"could not be read"
	);
	const sheet = utils.aoa_to_sheet([["Notes"]]);
	sheet["ALM2001"] = { t: "s", v: "far away" };
	sheet["!ref"] = "A1:ALM2001";
	expect(() => parseUnitMatrix(workbook(sheet))).toThrow("could not be read");
});
it("detects an unmerged heading with empty neighbours", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "South"],
		["Storey", 9, 10],
		[1, "S1", "S2"],
	]);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		name: "South",
		stacks: ["09", "10"],
		unitCount: 2,
	});
});

it("finds all three bands including bottom-aligned shorter Blocks", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North", null, null, "East"],
		[null, 1, 2, null, 3, 4],
		[3, "A", "A", 3, "B", "B"],
		[2, "A", "A", 2, "B", "B"],
		[null, null, null, 1, "B", "B"],
		[],
		[null, "South", null, null, "West"],
		[null, 5, 6, null, 7, 8],
		[null, null, null, 6, "C", "C"],
		[null, null, null, 5, "C", "C"],
		[null, null, null, 4, "C", "C"],
		[null, null, null, 3, "C", "C"],
		[2, "D", "D", 2, "C", "C"],
		[1, "D", "D", 1, "C", "C"],
		[],
		[null, "Central"],
		[null, 9, 10],
		[1, "E", "E"],
	]);
	sheet["!merges"] = ["B1:C1", "E1:F1", "B7:C7", "E7:F7", "B16:C16"].map(
		utils.decode_range
	);
	expect(
		parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks.map(
			({ name, unitCount }) => ({ name, unitCount })
		)
	).toEqual([
		{ name: "North", unitCount: 4 },
		{ name: "East", unitCount: 6 },
		{ name: "South", unitCount: 4 },
		{ name: "West", unitCount: 12 },
		{ name: "Central", unitCount: 2 },
	]);
});
it("skips stack metadata and reads cached Storeys below vertically merged stack numbers", () => {
	const sheet = utils.aoa_to_sheet([
		[null, null, "North"],
		["Unit", null, 1, 2],
		["Flr"],
		[],
		[2, null, "PH", null],
		[1, null, "C1", "C2"],
	]);
	sheet["A5"] = { t: "n", f: "SUM(A6,1)", v: 2 };
	sheet["!merges"] = ["C1:D1", "C2:C3", "D2:D3", "C5:D5"].map(
		utils.decode_range
	);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		unitCount: 3,
		storeys: [
			{ name: "01", cells: ["C1", "C2"] },
			{ name: "02", cells: ["PH", null] },
		],
	});
});
it("drops empty Storeys and names floor 1 and basement labels in stable warnings", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[null, 1, 2],
		[2, "A", "B"],
		[1],
		["B1"],
		["B2"],
		[],
		[null, "A", "B"],
		[4, "UNITS"],
	]);
	sheet["!merges"] = [utils.decode_range("B1:C1")];
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		unitCount: 2,
		storeys: [{ name: "02", cells: ["A", "B"] }],
		warnings: [
			{ code: "EMPTY_STOREY", label: "1" },
			{ code: "EMPTY_STOREY", label: "B1" },
			{ code: "EMPTY_STOREY", label: "B2" },
		],
	});
});
it("drops the later repeated Storey label, including numeric padding equivalents", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[null, 1, 2],
		[2, "A", "B"],
		["02", "WRONG", "WRONG"],
		[1, "C", "D"],
	]);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		unitCount: 4,
		storeys: [
			{ name: "01", cells: ["C", "D"] },
			{ name: "02", cells: ["A", "B"] },
		],
		warnings: [{ code: "DUPLICATE_STOREY", label: "02" }],
	});
});
it("keeps non-consecutive stack numbers and warns without renumbering", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[null, 8, 10],
		[1, "A", "B"],
	]);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		stacks: ["08", "10"],
		unitCount: 2,
		warnings: [{ code: "NON_CONSECUTIVE_STACKS" }],
	});
});
it("infers stacks from a convincing labelled grid when its stack row is missing", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[],
		[2, "A", null, "C"],
		[1, "D", "E", "F"],
		[],
		[null, "Legend"],
		[null, "A", "Category"],
		[null, "B", "Category"],
	]);
	sheet["!merges"] = ["B1:D1", "B6:D6"].map(utils.decode_range);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks).toMatchObject([
		{
			name: "North",
			stacks: ["01", "02", "03"],
			unitCount: 5,
			warnings: [{ code: "INFERRED_STACKS" }],
		},
	]);
});
it("retains a Block with no Units so the Administrator can exclude it", () => {
	const sheet = utils.aoa_to_sheet([[null, "North"], [null, 1, 2], [2], [1]]);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		name: "North",
		stacks: ["01", "02"],
		storeys: [],
		unitCount: 0,
		warnings: [
			{ code: "EMPTY_STOREY", label: "2" },
			{ code: "EMPTY_STOREY", label: "1" },
			{ code: "EMPTY_BLOCK" },
		],
	});
});
it("does not mistake a final Unit cell for a Block above a type-count legend", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[null, 1, 2],
		[1, "A", "C2S (p)"],
		[],
		[null, "TYPE", "Level", "Total"],
		[null, "1BR+S", 1, 1],
		[null, "4BR", 1, 4],
		[null, "5BR", 1, 2],
	]);
	expect(
		parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks.map((b) => b.name)
	).toEqual(["North"]);
});
it("warns about empty bottom Storeys after one alignment spacer without reading a schematic", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[null, 1, 2],
		[2, "A", "B"],
		[],
		[1],
		["B1"],
		["B2"],
		[],
		[null, "A", "B"],
		[null, "C", "D"],
		[4, "UNITS"],
	]);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		unitCount: 2,
		warnings: [
			{ code: "EMPTY_STOREY", label: "1" },
			{ code: "EMPTY_STOREY", label: "B1" },
			{ code: "EMPTY_STOREY", label: "B2" },
		],
	});
});
it("trims qualifiers and collapses internal whitespace without interpreting their code", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[null, 1, 2, 3, 4],
		[1, " BP2(p) (M)  ", " C1  (p) ", " C1 (d)  ", "BP2(p)  "],
	]);
	expect(
		parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]!.storeys[0]!.cells
	).toEqual(["BP2(p) (M)", "C1 (p)", "C1 (d)", "BP2(p)"]);
});
it("keeps filled cells after gaps in a partial top Storey", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[null, 1, 2, 3, 4, 5],
		[8, "A", null, "C", null, "E"],
		[7, "A", "B", "C", "D", "E"],
	]);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		unitCount: 8,
		storeys: [
			{ name: "07", cells: ["A", "B", "C", "D", "E"] },
			{ name: "08", cells: ["A", null, "C", null, "E"] },
		],
	});
});
it("keeps stacks that begin above Storey 1 as absent lower Units", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[null, 17, 18, 19],
		[3, "A", "B", "C"],
		[2, "A", "B", null],
		[1, "A", null, null],
	]);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		unitCount: 6,
		stacks: ["17", "18", "19"],
		storeys: [
			{ name: "01", cells: ["A", null, null] },
			{ name: "02", cells: ["A", "B", null] },
			{ name: "03", cells: ["A", "B", "C"] },
		],
		warnings: [],
	});
});
it("uses shared Storey identity for case and repeated internal spaces", () => {
	const sheet = utils.aoa_to_sheet([
		[null, "North"],
		[null, 1, 2],
		[" Upper   Ground ", "A", "B"],
		["upper ground", "WRONG", "WRONG"],
	]);
	expect(parseUnitMatrix(workbook(sheet)).sheets[0]!.blocks[0]).toMatchObject({
		unitCount: 2,
		storeys: [{ name: "Upper Ground", cells: ["A", "B"] }],
		warnings: [{ code: "DUPLICATE_STOREY", label: "upper ground" }],
	});
});
