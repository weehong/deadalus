import {
	apiFetch,
	apiFetchVoid,
	apiFetchEnvelope,
	type PaginationMeta,
} from "@/common/api";

export interface SubcontractorRow {
	id: string;
	name: string;
	memberCount: number;
	phones: Array<string>;
}

export interface DirectoryPage {
	data: Array<SubcontractorRow>;
	meta: PaginationMeta;
}

export interface DirectoryParameters {
	q?: string;
	page: number;
	pageSize: number;
}

export const fetchSubcontractors = async (
	parameters: DirectoryParameters
): Promise<DirectoryPage> => {
	const query = new URLSearchParams({
		page: parameters.page.toString(),
		pageSize: parameters.pageSize.toString(),
	});
	if (parameters.q) query.set("q", parameters.q.trim());
	const response = await apiFetchEnvelope<Array<SubcontractorRow>>(
		`/api/v1/subcontractors?${query.toString()}`
	);
	if (!response.meta) throw new Error("Missing Directory pagination metadata");
	return { data: response.data, meta: response.meta };
};

export interface Member {
	id: string;
	name: string;
	phone: string;
}
export interface Subcontractor {
	id: string;
	name: string;
	members: Array<Member>;
}
export const fetchSubcontractor = (id: string): Promise<Subcontractor> =>
	apiFetch<Subcontractor>(`/api/v1/subcontractors/${encodeURIComponent(id)}`);

export const deleteSubcontractor = (id: string): Promise<void> =>
	apiFetchVoid(`/api/v1/subcontractors/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});

export const removeMember = (id: string, memberId: string): Promise<void> =>
	apiFetchVoid(
		`/api/v1/subcontractors/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`,
		{ method: "DELETE" }
	);

export interface CreateSubcontractorInput {
	name: string;
	member: { name: string; phone: string };
}
export const createSubcontractor = (
	input: CreateSubcontractorInput
): Promise<Subcontractor> =>
	apiFetch<Subcontractor>("/api/v1/subcontractors", {
		method: "POST",
		body: JSON.stringify(input),
	});

export const renameSubcontractor = (
	id: string,
	input: { name: string }
): Promise<Subcontractor> =>
	apiFetch<Subcontractor>(`/api/v1/subcontractors/${encodeURIComponent(id)}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});

export interface MemberInput {
	name: string;
	phone: string;
}
export const addMember = (
	id: string,
	input: MemberInput
): Promise<Subcontractor> =>
	apiFetch<Subcontractor>(
		`/api/v1/subcontractors/${encodeURIComponent(id)}/members`,
		{ method: "POST", body: JSON.stringify(input) }
	);
export const editMember = (
	id: string,
	memberId: string,
	input: Partial<MemberInput>
): Promise<Subcontractor> =>
	apiFetch<Subcontractor>(
		`/api/v1/subcontractors/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`,
		{ method: "PATCH", body: JSON.stringify(input) }
	);
