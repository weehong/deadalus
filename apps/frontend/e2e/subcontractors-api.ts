import type { Page } from "@playwright/test";

// The fake implements the API contract on its own; it must not import backend source.
/** Contract rule: strip separators, `00` becomes `+`, no `+` defaults to +65, then E.164 or null. */
const normalizePhone = (input: string): string | null => {
	const compact = input.replace(/[\s\-()[\].]/g, "");
	const international = compact.startsWith("00")
		? `+${compact.slice(2)}`
		: compact;
	const phone = international.startsWith("+")
		? international
		: `+65${international}`;
	return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
};
/** Contract rule: Directory identity ignores case and collapses runs of whitespace. */
const subcontractorNameKey = (name: string): string =>
	name.trim().replace(/\s+/g, " ").toLowerCase();

export interface FakeMember {
	id: string;
	name: string;
	phone: string;
}

export interface FakeSubcontractor {
	id: string;
	name: string;
	members: Array<FakeMember>;
}

export const directoryFixtures = (): Array<FakeSubcontractor> =>
	Array.from({ length: 21 }, (_, index) => ({
		id: `subcontractor-${index + 1}`,
		name: `Subcontractor ${String(index + 1).padStart(2, "0")}`,
		members: [
			{
				id: `member-${index + 1}`,
				name: `Member ${index + 1}`,
				phone: `+659123${String(index + 1).padStart(4, "0")}`,
			},
		],
	}));

/** Browser boundary: the Session, router, query cache and screens stay real. */
export const interceptSubcontractors = async (
	page: Page,
	records: Array<FakeSubcontractor> = directoryFixtures()
): Promise<void> => {
	await page.route("**/api/v1/subcontractors**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		if (request.headers()["authorization"] !== "Bearer e2e-access-token") {
			await route.fulfill({
				status: 401,
				json: { error: { code: "UNAUTHORIZED", message: "Missing Session" } },
			});
			return;
		}

		if (
			request.method() === "POST" &&
			url.pathname === "/api/v1/subcontractors"
		) {
			const body = request.postDataJSON() as {
				name?: string;
				member?: { name?: string; phone?: string };
			};
			const name = body.name?.trim();
			const memberName = body.member?.name?.trim();
			const phone = normalizePhone(body.member?.phone ?? "");
			if (!name || !memberName || !phone) {
				await route.fulfill({
					status: 400,
					json: { error: { code: "BAD_REQUEST", message: "Invalid input" } },
				});
				return;
			}
			if (
				records.some(
					(record) =>
						subcontractorNameKey(record.name) === subcontractorNameKey(name)
				)
			) {
				await route.fulfill({
					status: 409,
					json: {
						error: { code: "SUBCONTRACTOR_NAME_TAKEN", message: "Name taken" },
					},
				});
				return;
			}
			const clash = records.find((record) =>
				record.members.some((member) => member.phone === phone)
			);
			if (clash) {
				await route.fulfill({
					status: 409,
					json: {
						error: {
							code: "MEMBER_PHONE_TAKEN",
							message: "Phone taken",
							details: {
								subcontractorId: clash.id,
								subcontractorName: clash.name,
							},
						},
					},
				});
				return;
			}
			const id = crypto.randomUUID();
			const record = {
				id,
				name,
				members: [{ id: crypto.randomUUID(), name: memberName, phone }],
			};
			records.push(record);
			await route.fulfill({ status: 201, json: { data: record } });
			return;
		}
		if (
			request.method() === "GET" &&
			url.pathname === "/api/v1/subcontractors"
		) {
			const currentPage = Number(url.searchParams.get("page") ?? 1);
			const pageSize = Math.min(
				100,
				Number(url.searchParams.get("pageSize") ?? 20)
			);
			const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
			const digits = q.replace(/\D/g, "");
			const filtered = records.filter(
				(record) =>
					!q ||
					record.name.toLowerCase().includes(q) ||
					record.members.some(
						(member) =>
							member.name.toLowerCase().includes(q) ||
							(digits.length > 0 &&
								member.phone.replace(/\D/g, "").includes(digits))
					)
			);
			const sorted = [...filtered].sort((left, right) =>
				subcontractorNameKey(left.name).localeCompare(
					subcontractorNameKey(right.name)
				)
			);
			await route.fulfill({
				json: {
					data: sorted
						.slice((currentPage - 1) * pageSize, currentPage * pageSize)
						.map((record) => ({
							id: record.id,
							name: record.name,
							memberCount: record.members.length,
							phones: record.members.map((member) => member.phone),
						})),
					meta: { page: currentPage, pageSize, total: sorted.length },
				},
			});
			return;
		}
		const memberWriteMatch =
			/^\/api\/v1\/subcontractors\/([^/]+)\/members(?:\/([^/]+))?$/.exec(
				url.pathname
			);
		if (
			memberWriteMatch &&
			((request.method() === "POST" && !memberWriteMatch[2]) ||
				(request.method() === "PATCH" && memberWriteMatch[2]))
		) {
			const record = records.find(
				(entry) => entry.id === decodeURIComponent(memberWriteMatch[1] ?? "")
			);
			const memberId = memberWriteMatch[2]
				? decodeURIComponent(memberWriteMatch[2])
				: undefined;
			const member = memberId
				? record?.members.find((entry) => entry.id === memberId)
				: undefined;
			if (!record || (memberId && !member)) {
				await route.fulfill({
					status: 404,
					json: {
						error: {
							code: "NOT_FOUND",
							message: "Member or Subcontractor not found",
						},
					},
				});
				return;
			}
			const body = request.postDataJSON() as { name?: string; phone?: string };
			const name = body.name === undefined ? member?.name : body.name.trim();
			const phone =
				body.phone === undefined ? member?.phone : normalizePhone(body.phone);
			if (
				!name ||
				!phone ||
				(body.name === undefined && body.phone === undefined)
			) {
				await route.fulfill({
					status: 400,
					json: {
						error: { code: "BAD_REQUEST", message: "Invalid Member input" },
					},
				});
				return;
			}
			const clash = records.find((entry) =>
				entry.members.some(
					(other) => other.id !== memberId && other.phone === phone
				)
			);
			if (clash) {
				await route.fulfill({
					status: 409,
					json: {
						error: {
							code: "MEMBER_PHONE_TAKEN",
							message: "Phone taken",
							details: {
								subcontractorId: clash.id,
								subcontractorName: clash.name,
							},
						},
					},
				});
				return;
			}
			if (member) Object.assign(member, { name, phone });
			else record.members.push({ id: crypto.randomUUID(), name, phone });
			await route.fulfill({
				status: member ? 200 : 201,
				json: {
					data: {
						...record,
						members: [...record.members].sort(
							(left, right) =>
								left.name.localeCompare(right.name) ||
								left.phone.localeCompare(right.phone)
						),
					},
				},
			});
			return;
		}

		const memberMatch =
			/^\/api\/v1\/subcontractors\/([^/]+)\/members\/([^/]+)$/.exec(
				url.pathname
			);
		if (request.method() === "DELETE" && memberMatch) {
			const record = records.find(
				(entry) => entry.id === decodeURIComponent(memberMatch[1] ?? "")
			);
			const memberId = decodeURIComponent(memberMatch[2] ?? "");
			if (record?.members.some((member) => member.id === memberId)) {
				if (record.members.length === 1) {
					await route.fulfill({
						status: 409,
						json: {
							error: {
								code: "LAST_MEMBER",
								message: "A Subcontractor must keep at least one Member.",
							},
						},
					});
				} else {
					record.members = record.members.filter(
						(member) => member.id !== memberId
					);
					await route.fulfill({ status: 204 });
				}
				return;
			}
		}
		const detailMatch = /^\/api\/v1\/subcontractors\/([^/]+)$/.exec(
			url.pathname
		);

		if (request.method() === "PATCH" && detailMatch) {
			const record = records.find(
				(entry) => entry.id === decodeURIComponent(detailMatch[1] ?? "")
			);
			if (record) {
				const body: unknown = request.postDataJSON();
				const name =
					typeof body === "object" &&
					body !== null &&
					"name" in body &&
					typeof body.name === "string"
						? body.name.trim()
						: "";
				if (!name)
					await route.fulfill({
						status: 400,
						json: {
							error: { code: "BAD_REQUEST", message: "Name is required" },
						},
					});
				else if (
					records.some(
						(entry) =>
							entry.id !== record.id &&
							subcontractorNameKey(entry.name) === subcontractorNameKey(name)
					)
				)
					await route.fulfill({
						status: 409,
						json: {
							error: {
								code: "SUBCONTRACTOR_NAME_TAKEN",
								message: "Name is taken",
							},
						},
					});
				else {
					record.name = name;
					await route.fulfill({ json: { data: record } });
				}
				return;
			}
		}
		if (request.method() === "DELETE" && detailMatch) {
			const index = records.findIndex(
				(entry) => entry.id === decodeURIComponent(detailMatch[1] ?? "")
			);
			if (index !== -1) {
				records.splice(index, 1);
				await route.fulfill({ status: 204 });
				return;
			}
		}
		if (request.method() === "GET" && detailMatch) {
			const record = records.find(
				(entry) => entry.id === decodeURIComponent(detailMatch[1] ?? "")
			);
			if (record) {
				await route.fulfill({
					json: {
						data: {
							...record,
							members: [...record.members].sort(
								(left, right) =>
									left.name.localeCompare(right.name) ||
									left.phone.localeCompare(right.phone)
							),
						},
					},
				});
				return;
			}
		}
		await route.fulfill({
			status: 404,
			json: { error: { code: "NOT_FOUND", message: "Not found" } },
		});
	});
};
