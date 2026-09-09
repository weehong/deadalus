import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

/**
 * The Session read model. The provider owns persistence; this store mirrors
 * its auth-state stream so routes and components read a synchronous value.
 * `restoring` is true until the first auth-state event arrives after boot.
 */
type AuthState = {
	restoring: boolean;
	session: Session | null;
	restore: (session: Session | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
	restoring: true,
	session: null,
	restore: (session): void => {
		set({ restoring: false, session });
	},
}));
