import { apiFetch, type ApiRequestOptions } from "@/common/api";
import type { ProgressEntry, ProgressEntryInput } from "@/common/items";
import type {
	FieldMember,
	FieldProject,
	FieldProjectRow,
	FieldUnitItems,
	MemberSession,
} from "@/features/field/types";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

/**
 * The Field's requests carry the Member token as the bearer. A 401 on any
 * of them ends the Session: the token has expired, or the Member has been
 * removed from the Directory, and the guarded layout sends them to Sign in.
 */
const memberSession: ApiRequestOptions = {
	getToken: (): string | null =>
		useMemberSessionStore.getState().session?.token ?? null,
	onUnauthorized: (): void => {
		useMemberSessionStore.getState().end("expired");
	},
};

/** Fetch from the Field's routes as the Member, unwrapping the `{ data }` envelope. */
export const fieldFetch = <T>(path: string, init?: RequestInit): Promise<T> =>
	apiFetch<T>(path, init, memberSession);

/** Sign in with a phone number alone; the API normalises it. */
export const signInWithPhone = (phone: string): Promise<MemberSession> =>
	fieldFetch<MemberSession>("/api/v1/field/sessions", {
		method: "POST",
		body: JSON.stringify({ phone }),
	});

/** The Member behind the current Session; 401 once they are removed. */
export const fetchMember = (): Promise<FieldMember> =>
	fieldFetch<FieldMember>("/api/v1/field/me");

/** The Projects where the Member's Subcontractor holds Items; the API scopes them, nothing is sent. */
export const fetchFieldProjects = (): Promise<Array<FieldProjectRow>> =>
	fieldFetch<Array<FieldProjectRow>>("/api/v1/field/projects");

/** One Project as the Subcontractor sees it; 404 where it holds nothing there. */
export const fetchFieldProject = (id: string): Promise<FieldProject> =>
	fieldFetch<FieldProject>(`/api/v1/field/projects/${encodeURIComponent(id)}`);

const itemEntriesPath = (itemId: string): string =>
	`/api/v1/field/items/${encodeURIComponent(itemId)}/entries`;

/** The Unit's heading and the Subcontractor's Items there; 404 where it holds nothing. */
export const fetchFieldUnitItems = (unitId: string): Promise<FieldUnitItems> =>
	fieldFetch<FieldUnitItems>(
		`/api/v1/field/units/${encodeURIComponent(unitId)}/items`
	);

/** Enter progress on one of the Subcontractor's Items as the Member; answers with the Unit as the Field reads it. */
export const enterFieldProgress = (
	itemId: string,
	input: ProgressEntryInput
): Promise<FieldUnitItems> =>
	fieldFetch<FieldUnitItems>(itemEntriesPath(itemId), {
		method: "POST",
		body: JSON.stringify(input),
	});

/** One of the Subcontractor's Items' history, newest first. */
export const fetchFieldProgressEntries = (
	itemId: string
): Promise<Array<ProgressEntry>> =>
	fieldFetch<Array<ProgressEntry>>(itemEntriesPath(itemId));
