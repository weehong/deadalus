import { getAccessToken } from "@/auth/auth";

interface ApiEnvelope<T> {
	data: T;
}

interface ApiErrorBody {
	error?: { code?: string; message?: string };
}

export class ApiRequestError extends Error {
	public constructor(
		public readonly status: number,
		message: string,
		public readonly code?: string
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

/**
 * Fetch from the API, unwrapping the `{ data }` envelope. The current Session's
 * access token rides along as a bearer header so protected routes can verify
 * the caller against Supabase's signing keys.
 */
export async function apiFetch<T>(
	path: string,
	init?: RequestInit
): Promise<T> {
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
			body.error?.code
		);
	}

	const body = (await response.json()) as ApiEnvelope<T>;
	return body.data;
}
