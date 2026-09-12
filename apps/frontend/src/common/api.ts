import { getAccessToken } from "@/auth/auth";

export interface PaginationMeta {
	page: number;
	pageSize: number;
	total: number;
}

/** A successful envelope; `meta` carries page metadata or the counts of a bulk action. */
export interface ApiEnvelope<T, M = PaginationMeta> {
	data: T;
	meta?: M;
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

/** Where a request's bearer comes from and what a 401 means; the Administrator's Session by default. */
export interface ApiRequestOptions {
	/** The bearer token for the request; null sends none. */
	getToken?: () => Promise<string | null> | string | null;
	/** Called when a request that carried a token is answered 401: the Session is over. */
	onUnauthorized?: () => void;
}

/** Attach the Session's token and translate failed API responses. */
async function apiRequest(
	path: string,
	init?: RequestInit,
	{ getToken = getAccessToken, onUnauthorized }: ApiRequestOptions = {}
): Promise<Response> {
	const token = await getToken();
	const response = await fetch(`${API_URL}${path}`, {
		...init,
		headers: {
			...(init?.body instanceof FormData
				? {}
				: { "Content-Type": "application/json" }),
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
		if (response.status === 401 && token) onUnauthorized?.();
		throw new ApiRequestError(
			response.status,
			body.error?.message ?? `Request failed: ${response.status.toString()}`,
			body.error?.code,
			body.error?.details
		);
	}

	return response;
}

/** Fetch a JSON envelope with the Session's token. */
export async function apiFetchEnvelope<T, M = PaginationMeta>(
	path: string,
	init?: RequestInit,
	options?: ApiRequestOptions
): Promise<ApiEnvelope<T, M>> {
	const response = await apiRequest(path, init, options);
	return (await response.json()) as ApiEnvelope<T, M>;
}

/**
 * Fetch from the API, unwrapping the `{ data }` envelope. The Administrator's
 * access token rides along as a bearer header so protected routes can verify
 * the caller against Supabase's signing keys; the Field passes its own
 * `options` to send the Member token instead.
 */
export async function apiFetch<T>(
	path: string,
	init?: RequestInit,
	options?: ApiRequestOptions
): Promise<T> {
	return (await apiFetchEnvelope<T>(path, init, options)).data;
}

/** Send a request whose successful response has no body (HTTP 204). */
export async function apiFetchVoid(
	path: string,
	init?: RequestInit
): Promise<void> {
	await apiRequest(path, init);
}
