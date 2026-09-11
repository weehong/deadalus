import { getAccessToken } from "@/auth/auth";

export interface PaginationMeta {
	page: number;
	pageSize: number;
	total: number;
}

export interface ApiEnvelope<T> {
	data: T;
	meta?: PaginationMeta;
}

interface ApiErrorBody {
	error?: { code?: string; message?: string; details?: unknown };
}

export class ApiRequestError extends Error {
	public constructor(
		public readonly status: number,
		message: string,
		public readonly code?: string,
		public readonly details?: unknown
	) {
		super(message);
		this.name = "ApiRequestError";
	}
}

/**
 * API origin. Empty in development: Vite proxies `/api` to the backend (see
 * `server.proxy` in vite.config.ts), so requests stay same-origin and never
 * trigger CORS. Production builds set VITE_API_URL to the real API origin.
 */
const API_URL = import.meta.env.VITE_API_URL ?? "";

/** Attach the current Session and translate failed API responses. */
async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
	const token = await getAccessToken();
	const response = await fetch(`${API_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...init?.headers,
		},
	});

	if (!response.ok) {
		// The API returns `{ error: { code, message, details } }`; fall back to
		// the status text when the body isn't the expected envelope.
		const body = (await response
			.json()
			.catch((): ApiErrorBody => ({}))) as ApiErrorBody;
		throw new ApiRequestError(
			response.status,
			body.error?.message ?? `Request failed: ${response.status.toString()}`,
			body.error?.code,
			body.error?.details
		);
	}

	return response;
}

/** Fetch a JSON envelope with the current Session. */
export async function apiFetchEnvelope<T>(
	path: string,
	init?: RequestInit
): Promise<ApiEnvelope<T>> {
	const response = await apiRequest(path, init);
	return (await response.json()) as ApiEnvelope<T>;
}

/**
 * Fetch from the API, unwrapping the `{ data }` envelope. The current Session's
 * access token rides along as a bearer header so protected routes can verify
 * the caller against Supabase's signing keys.
 */
export async function apiFetch<T>(
	path: string,
	init?: RequestInit
): Promise<T> {
	return (await apiFetchEnvelope<T>(path, init)).data;
}

/** Send a request whose successful response has no body (HTTP 204). */
export async function apiFetchVoid(
	path: string,
	init?: RequestInit
): Promise<void> {
	await apiRequest(path, init);
}
