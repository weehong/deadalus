import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AuthFailure = "InvalidCredentials" | "RateLimited" | "Unavailable" | "Unknown";
export class AuthenticationError extends Error {
	public constructor(public readonly kind: AuthFailure) { super(kind); this.name = "AuthenticationError"; }
}
type ErrorLike = { status?: number; message?: string };
export const mapAuthError = (error: unknown): AuthFailure => {
	if (error instanceof TypeError) return "Unavailable";
	const status = (error as ErrorLike | undefined)?.status;
	// Supabase represents a failed fetch with status 0 after catching the native TypeError.
	if (status === 0) return "Unavailable";
	if (status === 429) return "RateLimited";
	if (status !== undefined && status >= 400 && status < 500) return "InvalidCredentials";
	if (status !== undefined && status >= 500) return "Unavailable";
	return "Unknown";
};

export const signIn = async (email: string, password: string): Promise<Session> => {
	const { data, error } = await supabase.auth.signInWithPassword({ email, password });
	if (error) throw new AuthenticationError(mapAuthError(error));
	if (!data.session) throw new AuthenticationError("Unknown");
	return data.session;
};

export const observeAuth = (onChange: (session: Session | null) => void): (() => void) => {
	const { data } = supabase.auth.onAuthStateChange((_event, session) => { onChange(session); });
	return () => { data.subscription.unsubscribe(); };
};
