import { createClient } from "@supabase/supabase-js";

/*
 * The one place the provider client is created. Only `auth.ts` may import it;
 * components and routes consume the session read model instead.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Names of the required variables that are unset; empty when configured. Tests never need them. */
export const missingSupabaseEnvironmentVariables: Array<string> =
	import.meta.env.MODE === "test"
		? []
		: [
				...(url ? [] : ["VITE_SUPABASE_URL"]),
				...(anonKey ? [] : ["VITE_SUPABASE_ANON_KEY"]),
			];

export const supabase = createClient(
	url || "https://example.supabase.co",
	anonKey || "development-placeholder-key",
	{ auth: { persistSession: true } }
);
