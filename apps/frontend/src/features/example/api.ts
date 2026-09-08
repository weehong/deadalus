export interface Match {
	id: string;
	homeTeam: string;
	awayTeam: string;
	homeScore: number;
	awayScore: number;
	playedOn: string;
}

export interface CreateMatchInput {
	homeTeam: string;
	awayTeam: string;
}

interface ApiEnvelope<T> {
	data: T;
}

interface ApiErrorBody {
	error?: { message?: string };
}

/**
 * API origin. Empty in development: Vite proxies `/api` to the backend (see
 * `server.proxy` in vite.config.ts), so requests stay same-origin and never
 * trigger CORS. Production builds set VITE_API_URL to the real API origin.
 */
const API_URL = import.meta.env.VITE_API_URL ?? "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});

	if (!response.ok) {
		// The API returns `{ error: { code, message, details } }`; fall back to
		// the status text when the body isn't the expected envelope.
		const body = (await response.json().catch((): ApiErrorBody => ({}))) as ApiErrorBody;
		throw new Error(body.error?.message ?? `Request failed: ${response.status.toString()}`);
	}

	const body = (await response.json()) as ApiEnvelope<T>;
	return body.data;
}

export const fetchMatches = (): Promise<Array<Match>> =>
	apiFetch<Array<Match>>("/api/v1/matches");

export const createMatch = (input: CreateMatchInput): Promise<Match> =>
	apiFetch<Match>("/api/v1/matches", {
		method: "POST",
		body: JSON.stringify(input),
	});
