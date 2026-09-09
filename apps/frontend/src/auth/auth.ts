import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * The thin authentication boundary. Everything the application knows about
 * the provider passes through here: sign in, sign out, the auth-state stream,
 * and the access token the API needs.
 */

export type AuthFailure =
	"InvalidCredentials" | "RateLimited" | "Unavailable" | "Unknown";

export class AuthenticationError extends Error {
	public constructor(public readonly kind: AuthFailure) {
		super(kind);
		this.name = "AuthenticationError";
	}
}

type ErrorLike = { status?: number; message?: string };

/**
 * Collapse provider errors into a closed set. Every 400-class rejection —
 * wrong password, unknown email, unconfirmed email — becomes the same
 * `InvalidCredentials`, so the screen cannot be used to enumerate accounts.
 * Rate limiting and unavailability stay distinct because they are actionable.
 */
export const mapAuthError = (error: unknown): AuthFailure => {
	if (error instanceof TypeError) return "Unavailable";
	const status = (error as ErrorLike | undefined)?.status;
	// The provider reports a failed fetch as status 0 after catching the TypeError.
	if (status === 0) return "Unavailable";
	if (status === 429) return "RateLimited";
	if (status !== undefined && status >= 400 && status < 500)
		return "InvalidCredentials";
	if (status !== undefined && status >= 500) return "Unavailable";
	return "Unknown";
};

export const signIn = async (
	email: string,
	password: string
): Promise<Session> => {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});
	if (error) throw new AuthenticationError(mapAuthError(error));
	if (!data.session) throw new AuthenticationError("Unknown");
	return data.session;
};

export const signOut = async (): Promise<void> => {
	const { error } = await supabase.auth.signOut();
	if (error) throw new AuthenticationError(mapAuthError(error));
};

/** Subscribe to the provider's auth-state stream; returns the unsubscribe. */
export const observeAuth = (
	onChange: (session: Session | null) => void
): (() => void) => {
	const { data } = supabase.auth.onAuthStateChange((_event, session) => {
		onChange(session);
	});
	return () => {
		data.subscription.unsubscribe();
	};
};

/** The current access token for the API's bearer header, or null when signed out. */
export const getAccessToken = async (): Promise<string | null> => {
	const { data } = await supabase.auth.getSession();
	return data.session?.access_token ?? null;
};
