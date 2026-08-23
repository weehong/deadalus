import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Unit tests and stories never reach the provider, so they run on placeholders.
// Everywhere else a missing value is a configuration error, not a sign-in failure.
if (import.meta.env.MODE !== "test" && (!url || !anonKey)) {
	throw new Error(
		"Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example)."
	);
}

export const supabase = createClient(
	url || "https://example.supabase.co",
	anonKey || "development-placeholder-key",
	{
		auth: { persistSession: true },
	}
);
