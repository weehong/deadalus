import { describe, expect, it } from "vitest";
import {
	holdingCount,
	isValidSelection,
	removalCounts,
	selectAll,
	selectUnits,
	storeysOf,
	toUnitSelectionBody,
} from "@/features/projects/unit-selection";
import type { Project, Unit } from "@/features/projects/types";
const unit = (
	id: string,
	unitTypeId: string | null,
	held: Array<string> = []
): Unit => ({
	id,
	name: id,
	position: 0,
	unitTypeId,
	itemCount: held.length,
	entryCount: 0,
	progression: held.length ? 0 : null,
	items: held.map((catalogueItemId) => ({
		catalogueItemId,
		subcontractorId: null,
		entryCount: 0,
	})),
});
const rollup = { itemCount: 0, entryCount: 0, progression: null };
// Items: u1 {Wardrobe, Sink}, u2 {Wardrobe}, u3 {Sink}, u4 {Wardrobe, Sink},
// u5 none. Block A: 01 (u1 AS1, u2 BP2), 02 (u3 AS1); Block B: 01 (u4 BP2, u5 untyped).
const project: Project = {
	id: "p",
	name: "Gardens",
	code: "EG2",
	...rollup,
	blocks: [
		{
			id: "a",
			name: "A",
			position: 0,
			...rollup,
			storeys: [
				{
					id: "a1",
					name: "01",
					position: 0,
					...rollup,
					units: [
						unit("u1", "as1", ["wardrobe", "sink"]),
						unit("u2", "bp2", ["wardrobe"]),
					],
				},
				{
					id: "a2",
					name: "02",
					position: 1,
					...rollup,
					units: [unit("u3", "as1", ["sink"])],
				},
			],
		},
		{
			id: "b",
			name: "B",
			position: 1,
			...rollup,
			storeys: [
				{
					id: "b1",
					name: "01",
					position: 0,
					...rollup,
					units: [unit("u4", "bp2", ["wardrobe", "sink"]), unit("u5", null)],
				},
			],
		},
	],
	unitTypes: [
		{ id: "as1", code: "AS1", description: null, unitCount: 2 },
		{ id: "bp2", code: "BP2", description: null, unitCount: 2 },
	],
	catalogueItems: [
		{ id: "wardrobe", name: "Wardrobe", itemCount: 3 },
		{ id: "sink", name: "Sink", itemCount: 3 },
	],
};
const ids = (units: Array<Unit>): Array<string> => units.map((u) => u.id);
describe("storeysOf and selectAll", () => {
	it("offers every Storey of every Block, named by its Block, when no Block is chosen", () => {
		expect(storeysOf(project, null)).toEqual([
			{ id: "a1", name: "01", blockName: "A" },
			{ id: "a2", name: "02", blockName: "A" },
			{ id: "b1", name: "01", blockName: "B" },
		]);
		expect(storeysOf(project, "b")).toEqual([
			{ id: "b1", name: "01", blockName: "B" },
		]);
	});
	it("starts with everything selected", () => {
		expect(selectAll(project, null)).toEqual({
			blockId: null,
			storeyIds: ["a1", "a2", "b1"],
			unitTypeIds: ["as1", "bp2"],
		});
		expect(selectAll(project, "a").storeyIds).toEqual(["a1", "a2"]);
	});
});
describe("toUnitSelectionBody", () => {
	it("sends no filter when everything in scope is selected", () => {
		expect(toUnitSelectionBody(project, selectAll(project, null))).toEqual({});
		expect(toUnitSelectionBody(project, selectAll(project, "a"))).toEqual({
			blockIds: ["a"],
		});
	});
	it("sends only the narrowed lists", () => {
		expect(
			toUnitSelectionBody(project, {
				blockId: "a",
				storeyIds: ["a2"],
				unitTypeIds: ["as1", "bp2"],
			})
		).toEqual({ blockIds: ["a"], storeyIds: ["a2"] });
		expect(
			toUnitSelectionBody(project, {
				blockId: null,
				storeyIds: ["a1", "a2", "b1"],
				unitTypeIds: ["bp2"],
			})
		).toEqual({ unitTypeIds: ["bp2"] });
	});
	it("treats a Project without Unit Types as every Unit Type selected", () => {
		const untyped = { ...project, unitTypes: [] };
		expect(
			toUnitSelectionBody(untyped, {
				blockId: null,
				storeyIds: ["a1", "a2", "b1"],
				unitTypeIds: [],
			})
		).toEqual({});
	});
	it("flags an emptied list, which the API refuses", () => {
		expect(isValidSelection({})).toBe(true);
		expect(isValidSelection({ blockIds: ["a"], storeyIds: [] })).toBe(false);
		expect(isValidSelection({ unitTypeIds: [] })).toBe(false);
	});
});
describe("selectUnits", () => {
	it("selects every Unit with no filter and intersects the filters given", () => {
		expect(ids(selectUnits(project, {}))).toEqual([
			"u1",
			"u2",
			"u3",
			"u4",
			"u5",
		]);
		expect(ids(selectUnits(project, { blockIds: ["a"] }))).toEqual([
			"u1",
			"u2",
			"u3",
		]);
		expect(
			ids(selectUnits(project, { blockIds: ["a"], storeyIds: ["a1"] }))
		).toEqual(["u1", "u2"]);
		expect(ids(selectUnits(project, { unitTypeIds: ["bp2"] }))).toEqual([
			"u2",
			"u4",
		]);
	});
	it("never matches a Unit without a Unit Type against a Unit Type filter", () => {
		expect(ids(selectUnits(project, { unitTypeIds: ["as1", "bp2"] }))).toEqual([
			"u1",
			"u2",
			"u3",
			"u4",
		]);
	});
});
describe("holdingCount", () => {
	it("counts the selected Units already holding an Item made from the Catalogue Item", () => {
		expect(holdingCount(selectUnits(project, {}), "wardrobe")).toBe(3);
		expect(holdingCount(selectUnits(project, {}), "sink")).toBe(3);
		expect(
			holdingCount(selectUnits(project, { blockIds: ["a"] }), "wardrobe")
		).toBe(2);
		expect(
			holdingCount(selectUnits(project, { storeyIds: ["a1"] }), "sink")
		).toBe(1);
		expect(
			holdingCount(selectUnits(project, { unitTypeIds: ["bp2"] }), "sink")
		).toBe(1);
	});
	it("is zero for a Catalogue Item applied nowhere or an empty selection", () => {
		expect(holdingCount(selectUnits(project, {}), "basin")).toBe(0);
		expect(holdingCount([], "wardrobe")).toBe(0);
	});
});
describe("removalCounts", () => {
	/** The Project with entries on the named Items, keyed by Unit then Catalogue Item. */
	const withEntries = (
		entries: Record<string, Record<string, number>>
	): Project => ({
		...project,
		blocks: project.blocks.map((block) => ({
			...block,
			storeys: block.storeys.map((storey) => ({
				...storey,
				units: storey.units.map((held) => ({
					...held,
					items: held.items.map((item) => ({
						...item,
						entryCount: entries[held.id]?.[item.catalogueItemId] ?? 0,
					})),
				})),
			})),
		})),
	});
	it("counts the Items and exactly their own entries, leaving other Items in the same Units out", () => {
		// u1 holds Wardrobe (4 entries) beside a Sink (2); u2 Wardrobe alone (3).
		const shared = withEntries({
			u1: { wardrobe: 4, sink: 2 },
			u2: { wardrobe: 3 },
		});
		expect(removalCounts(selectUnits(shared, {}), "wardrobe")).toEqual({
			items: 3,
			entries: 7,
		});
		expect(
			removalCounts(selectUnits(shared, { unitTypeIds: ["bp2"] }), "wardrobe")
		).toEqual({ items: 2, entries: 3 });
		expect(
			removalCounts(selectUnits(shared, { storeyIds: ["a2"] }), "sink")
		).toEqual({ items: 1, entries: 0 });
	});
	it("is zero for a Catalogue Item applied nowhere or an empty selection", () => {
		expect(removalCounts(selectUnits(project, {}), "basin")).toEqual({
			items: 0,
			entries: 0,
		});
		expect(removalCounts([], "wardrobe")).toEqual({ items: 0, entries: 0 });
	});
});
