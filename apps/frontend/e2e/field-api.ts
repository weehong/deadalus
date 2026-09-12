import { expect, type Page, type Request } from "@playwright/test";
import { newestFirst, type FakeEntry } from "./catalogue-items-api";
import {
	ASSIGNED_AT,
	nameKey,
	nextEntry,
	normalizePhone,
	rollUp,
} from "./fake-shared";
import type { UnitItem } from "../src/common/items";

// The Field's browser-edge fake. It independently implements the API contract
// for sign-in, `me`, the Project reads and the Unit screen (never backend
// internals): the phone is normalised the way the Directory stores it, the
// token is opaque, a revoked Member gets 401 on the next request exactly as a
// Member removed from the Directory would, and every read and write is scoped
// the way the API scopes them: only where the Subcontractor holds Items, with
// its own counts and Progression, and a 404 for everything else. Entering
// progress appends an entry authored by the Member and moves the Item's
// Progression, so the drill-down's roll-ups reflect it on the way back.
export interface FakeMember {
	id: string;
	name: string;
	/** Stored in E.164, as the Directory keeps it. */
	phone: string;
	subcontractor: { id: string; name: string };
}

/** The fake's token names its Member, so any tab or reload can answer `me`. */
export const memberToken = (memberId: string): string =>
	`e2e-member-token:${memberId}`;

export const memberFixtures = (): Array<FakeMember> => [
	{
		id: "member-alex",
		name: "Alex Tan",
		phone: "+6591234567",
		subcontractor: { id: "acme", name: "Acme Joinery" },
	},
];

/**
 * The signed-in Subcontractor's work, as the fixture sees it: each Unit lists
 * the Items the Subcontractor holds there. Everything the API derives
 * (counts, averages, which nodes exist for the Field, the latest entry) is
 * derived here too, so the fixture only states what is held.
 */
export interface FakeFieldItem {
	id: string;
	/** The Catalogue Item's name; Items carry none of their own. */
	name: string;
	progression: number;
	/** The Item's history; absent means none. Entering progress appends here. */
	entries?: Array<FakeEntry>;
}
export interface FakeFieldUnit {
	id: string;
	name: string;
	/** The Items held here; empty means the Subcontractor holds none. */
	items: Array<FakeFieldItem>;
}
export interface FakeFieldStorey {
	id: string;
	name: string;
	units: Array<FakeFieldUnit>;
}
export interface FakeFieldBlock {
	id: string;
	name: string;
	storeys: Array<FakeFieldStorey>;
}
export interface FakeFieldProject {
	id: string;
	code: string;
	name: string;
	blocks: Array<FakeFieldBlock>;
}

/**
 * Gardens: Block A holds three Items across two Storeys (Unit 02 of Storey
 * 01 and all of Block B hold none); Unit 01 of Storey 02 holds a Sink with
 * two entries and a Wardrobe with one. Aurora holds one Item at 0. Zeta
 * holds nothing, so it is neither listed nor readable.
 */
export const fieldWorkFixtures = (): Array<FakeFieldProject> => [
	{
		id: "project-gardens",
		code: "EG2",
		name: "Gardens",
		blocks: [
			{
				id: "block-a",
				name: "A",
				storeys: [
					{
						id: "storey-a1",
						name: "01",
						units: [
							{
								id: "unit-a1-01",
								name: "01",
								items: [
									{ id: "item-a1-01-sink", name: "Sink", progression: 80 },
								],
							},
							{ id: "unit-a1-02", name: "02", items: [] },
						],
					},
					{
						id: "storey-a2",
						name: "02",
						units: [
							{
								id: "unit-a2-01",
								name: "01",
								items: [
									{
										id: "item-a2-01-wardrobe",
										name: "Wardrobe",
										progression: 100,
										entries: [
											{
												id: "entry-a2-01-wardrobe-1",
												value: 100,
												note: null,
												enteredByKind: "member",
												enteredByName: "Bo Lim",
												subcontractorName: "Acme Joinery",
												createdAt: "2026-09-09T13:00:00.000Z",
											},
										],
									},
									{
										id: "item-a2-01-sink",
										name: "Sink",
										progression: 40,
										entries: [
											{
												id: "entry-a2-01-sink-1",
												value: 20,
												note: "Carcass in",
												enteredByKind: "administrator",
												enteredByName: "administrator@example.com",
												subcontractorName: null,
												createdAt: "2026-09-08T12:00:00.000Z",
											},
											{
												id: "entry-a2-01-sink-2",
												value: 40,
												note: null,
												enteredByKind: "member",
												enteredByName: "Alex Tan",
												subcontractorName: "Acme Joinery",
												createdAt: "2026-09-09T12:00:00.000Z",
											},
										],
									},
								],
							},
						],
					},
				],
			},
			{
				id: "block-b",
				name: "B",
				storeys: [
					{
						id: "storey-b1",
						name: "01",
						units: [{ id: "unit-b1-01", name: "01", items: [] }],
					},
				],
			},
		],
	},
	{
		id: "project-aurora",
		code: "AUR",
		name: "Aurora",
		blocks: [
			{
				id: "block-c",
				name: "C",
				storeys: [
					{
						id: "storey-c-g",
						name: "G",
						units: [
							{
								id: "unit-c-g-01",
								name: "01",
								items: [
									{ id: "item-c-g-01-sink", name: "Sink", progression: 0 },
								],
							},
						],
					},
				],
			},
		],
	},
	{
		id: "project-zeta",
		code: "ZT",
		name: "Zeta",
		blocks: [
			{
				id: "block-d",
				name: "D",
				storeys: [
					{
						id: "storey-d1",
						name: "01",
						units: [{ id: "unit-d1-01", name: "01", items: [] }],
					},
				],
			},
		],
	},
];

const memberShape = (
	member: FakeMember
): Omit<FakeMember, "phone"> & { phone?: never } => ({
	id: member.id,
	name: member.name,
	subcontractor: member.subcontractor,
});

interface Rollup {
	itemCount: number;
	progression: number;
}
/** The roll-up of what the Subcontractor holds beneath a node; the Field never shows an empty one. */
const rollUpHeld = (units: Array<FakeFieldUnit>): Rollup => {
	const { itemCount, progression } = rollUp(
		units.flatMap((unit) => unit.items)
	);
	return { itemCount, progression: progression ?? 0 };
};

const heldUnit = (
	unit: FakeFieldUnit
): ({ id: string; name: string } & Rollup) | null =>
	unit.items.length > 0
		? { id: unit.id, name: unit.name, ...rollUpHeld([unit]) }
		: null;
const heldStorey = (
	storey: FakeFieldStorey
): ({ id: string; name: string; units: Array<unknown> } & Rollup) | null => {
	const units = storey.units.map(heldUnit).filter((unit) => unit !== null);
	if (units.length === 0) return null;
	return {
		id: storey.id,
		name: storey.name,
		...rollUpHeld(storey.units),
		units,
	};
};
const heldBlock = (
	block: FakeFieldBlock
): ({ id: string; name: string; storeys: Array<unknown> } & Rollup) | null => {
	const storeys = block.storeys
		.map(heldStorey)
		.filter((storey) => storey !== null);
	if (storeys.length === 0) return null;
	const units = block.storeys.flatMap((storey) => storey.units);
	return { id: block.id, name: block.name, ...rollUpHeld(units), storeys };
};
/** The Project as the Field reads it, or null where the Subcontractor holds nothing. */
const heldProject = (
	project: FakeFieldProject
):
	| ({
			id: string;
			code: string;
			name: string;
			blocks: Array<unknown>;
	  } & Rollup)
	| null => {
	const blocks = project.blocks
		.map(heldBlock)
		.filter((block) => block !== null);
	if (blocks.length === 0) return null;
	const units = project.blocks
		.flatMap((block) => block.storeys)
		.flatMap((storey) => storey.units);
	return {
		id: project.id,
		code: project.code,
		name: project.name,
		...rollUpHeld(units),
		blocks,
	};
};

/** A Unit with its ancestry, as the Unit screen's heading needs it. */
interface Located {
	project: FakeFieldProject;
	block: FakeFieldBlock;
	storey: FakeFieldStorey;
	unit: FakeFieldUnit;
}
const locateUnits = (work: Array<FakeFieldProject>): Array<Located> =>
	work.flatMap((project) =>
		project.blocks.flatMap((block) =>
			block.storeys.flatMap((storey) =>
				storey.units.map((unit) => ({ project, block, storey, unit }))
			)
		)
	);
const locateUnit = (
	work: Array<FakeFieldProject>,
	unitId: string
): Located | undefined =>
	locateUnits(work).find((located) => located.unit.id === unitId);
const locateItem = (
	work: Array<FakeFieldProject>,
	itemId: string
): (Located & { item: FakeFieldItem }) | undefined =>
	locateUnits(work)
		.flatMap((located) =>
			located.unit.items.map((item) => ({ ...located, item }))
		)
		.find((located) => located.item.id === itemId);

/** The Unit's Items as the API answers them: every one the Member's own Subcontractor's, by name key. */
const unitItemsOf = (
	unit: FakeFieldUnit,
	member: FakeMember
): Array<UnitItem> =>
	[...unit.items]
		.sort(
			(a, b) =>
				nameKey(a.name).localeCompare(nameKey(b.name)) ||
				a.id.localeCompare(b.id)
		)
		.map((item) => {
			const [latest] = newestFirst(item.entries ?? []);
			return {
				id: item.id,
				catalogueItemId: `catalogue-${nameKey(item.name)}`,
				name: item.name,
				subcontractor: member.subcontractor,
				assignedAt: ASSIGNED_AT,
				progression: item.progression,
				latestEntry: latest
					? {
							value: latest.value,
							note: latest.note,
							enteredByName: latest.enteredByName,
							createdAt: latest.createdAt,
						}
					: null,
			};
		});
const unitScreen = (
	{ project, block, storey, unit }: Located,
	member: FakeMember
): unknown => ({
	project: { id: project.id, code: project.code, name: project.name },
	block: { id: block.id, name: block.name },
	storey: { id: storey.id, name: storey.name },
	unit: { id: unit.id, name: unit.name },
	items: unitItemsOf(unit, member),
});

/** A Member's entries are its own, with its Subcontractor's name snapshotted. */
const memberAuthor = (
	member: FakeMember
): Pick<
	FakeEntry,
	"enteredByKind" | "enteredByName" | "subcontractorName"
> => ({
	enteredByKind: "member",
	enteredByName: member.name,
	subcontractorName: member.subcontractor.name,
});

export interface FieldFake {
	/** Behave as though the signed-in Member was removed from the Directory. */
	revoke: () => void;
	/** How many `me` requests the fake has answered. */
	meRequests: () => number;
	/** Answer the next Project read with a 500, once. */
	failNextProjectRead: () => void;
}

export const interceptField = async (
	page: Page,
	members: Array<FakeMember> = memberFixtures(),
	/** What the signed-in Subcontractor holds; nothing by default. */
	work: Array<FakeFieldProject> = []
): Promise<FieldFake> => {
	let revoked = false;
	let meRequests = 0;
	let failNextProjectRead = false;

	const unauthorized = (
		message: string
	): { status: number; json: unknown } => ({
		status: 401,
		json: { error: { code: "UNAUTHORIZED", message } },
	});
	const notFound = (message: string): { status: number; json: unknown } => ({
		status: 404,
		json: { error: { code: "NOT_FOUND", message } },
	});
	/** The Member behind the bearer, or the 401 to answer with. */
	const authenticate = (
		request: Request
	):
		| { member: FakeMember }
		| { member: null; status: number; json: unknown } => {
		const bearer = request.headers()["authorization"] ?? "";
		const member = members.find(
			(record) => bearer === `Bearer ${memberToken(record.id)}`
		);
		if (!member || revoked)
			return {
				member: null,
				...unauthorized(
					revoked
						? "Member no longer exists"
						: "Invalid or expired Member token"
				),
			};
		return { member };
	};

	await page.route("**/api/v1/field/**", async (route) => {
		const request = route.request();
		const pathname = new URL(request.url()).pathname;
		if (pathname === "/api/v1/field/sessions" && request.method() === "POST") {
			const body = request.postDataJSON() as { phone?: unknown };
			const phone = typeof body.phone === "string" ? body.phone.trim() : "";
			if (!phone) {
				await route.fulfill({
					status: 400,
					json: {
						error: { code: "BAD_REQUEST", message: "Invalid request body" },
					},
				});
				return;
			}
			const normalized = normalizePhone(phone);
			const member = members.find((record) => record.phone === normalized);
			if (!member) {
				await route.fulfill({
					status: 404,
					json: {
						error: {
							code: "MEMBER_NOT_FOUND",
							message: "That phone number is not registered",
						},
					},
				});
				return;
			}
			revoked = false;
			await route.fulfill({
				status: 200,
				json: {
					data: { token: memberToken(member.id), member: memberShape(member) },
				},
			});
			return;
		}
		if (pathname === "/api/v1/field/me" && request.method() === "GET") {
			meRequests += 1;
			const auth = authenticate(request);
			if (!auth.member) {
				await route.fulfill({ status: auth.status, json: auth.json });
				return;
			}
			await route.fulfill({
				status: 200,
				json: { data: memberShape(auth.member) },
			});
			return;
		}
		if (pathname === "/api/v1/field/projects" && request.method() === "GET") {
			const auth = authenticate(request);
			if (!auth.member) {
				await route.fulfill({ status: auth.status, json: auth.json });
				return;
			}
			if (failNextProjectRead) {
				failNextProjectRead = false;
				await route.fulfill({
					status: 500,
					json: {
						error: { code: "INTERNAL_SERVER_ERROR", message: "Unavailable" },
					},
				});
				return;
			}
			const rows = work
				.map(heldProject)
				.filter((project) => project !== null)
				.sort(
					(a, b) =>
						nameKey(a.name).localeCompare(nameKey(b.name)) ||
						a.id.localeCompare(b.id)
				)
				.map(({ blocks: _blocks, ...row }) => row);
			await route.fulfill({ status: 200, json: { data: rows } });
			return;
		}
		const projectPath = /^\/api\/v1\/field\/projects\/([^/]+)$/.exec(pathname);
		if (projectPath && request.method() === "GET") {
			const auth = authenticate(request);
			if (!auth.member) {
				await route.fulfill({ status: auth.status, json: auth.json });
				return;
			}
			if (failNextProjectRead) {
				failNextProjectRead = false;
				await route.fulfill({
					status: 500,
					json: {
						error: { code: "INTERNAL_SERVER_ERROR", message: "Unavailable" },
					},
				});
				return;
			}
			const id = decodeURIComponent(projectPath[1]!);
			const project = work.find((record) => record.id === id);
			const held = project ? heldProject(project) : null;
			if (!held) {
				await route.fulfill(notFound("Project not found"));
				return;
			}
			await route.fulfill({ status: 200, json: { data: held } });
			return;
		}
		const unitPath = /^\/api\/v1\/field\/units\/([^/]+)\/items$/.exec(pathname);
		if (unitPath && request.method() === "GET") {
			const auth = authenticate(request);
			if (!auth.member) {
				await route.fulfill({ status: auth.status, json: auth.json });
				return;
			}
			const located = locateUnit(work, decodeURIComponent(unitPath[1]!));
			if (!located || located.unit.items.length === 0) {
				await route.fulfill(notFound("Unit not found"));
				return;
			}
			await route.fulfill({
				status: 200,
				json: { data: unitScreen(located, auth.member) },
			});
			return;
		}
		const entriesPath = /^\/api\/v1\/field\/items\/([^/]+)\/entries$/.exec(
			pathname
		);
		if (
			entriesPath &&
			(request.method() === "GET" || request.method() === "POST")
		) {
			const auth = authenticate(request);
			if (!auth.member) {
				await route.fulfill({ status: auth.status, json: auth.json });
				return;
			}
			const located = locateItem(work, decodeURIComponent(entriesPath[1]!));
			if (!located) {
				await route.fulfill(notFound("Item not found"));
				return;
			}
			const entries = (located.item.entries ??= []);
			if (request.method() === "GET") {
				await route.fulfill({
					status: 200,
					json: { data: newestFirst(entries) },
				});
				return;
			}
			const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
			const value = body["value"];
			const note = body["note"];
			const trimmedNote = typeof note === "string" ? note.trim() : undefined;
			const fieldErrors: Record<string, Array<string>> = {};
			if (
				typeof value !== "number" ||
				!Number.isInteger(value) ||
				value < 0 ||
				value > 100
			)
				fieldErrors["value"] = ["Expected a whole number from 0 to 100"];
			if (
				note !== undefined &&
				(typeof note !== "string" || !trimmedNote || trimmedNote.length > 200)
			)
				fieldErrors["note"] = ["Expected 1 to 200 characters"];
			if (Object.keys(fieldErrors).length > 0) {
				await route.fulfill({
					status: 400,
					json: {
						error: {
							code: "BAD_REQUEST",
							message: "Invalid request body",
							details: { formErrors: [], fieldErrors },
						},
					},
				});
				return;
			}
			entries.push(
				nextEntry(
					memberAuthor(auth.member),
					value as number,
					trimmedNote ?? null
				)
			);
			located.item.progression = value as number;
			await route.fulfill({
				status: 201,
				json: { data: unitScreen(located, auth.member) },
			});
			return;
		}
		await route.fulfill({
			status: 404,
			json: { error: { code: "NOT_FOUND", message: "Not found" } },
		});
	});
	return {
		revoke: (): void => {
			revoked = true;
		},
		meRequests: (): number => meRequests,
		failNextProjectRead: (): void => {
			failNextProjectRead = true;
		},
	};
};

/** Sign the fixture Member in from the Field's Sign in screen. */
export const signInMember = async (
	page: Page,
	phone = "9123 4567"
): Promise<void> => {
	await page.goto("/field/login");
	await page.getByRole("textbox", { name: "Phone number" }).fill(phone);
	await page.getByRole("button", { name: "Enter the Field" }).click();
	await expect(page).toHaveURL(/\/field$/);
};
