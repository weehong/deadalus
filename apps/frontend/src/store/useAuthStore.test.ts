import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./useAuthStore";

/* eslint-disable camelcase -- the provider's Session shape is snake_case. */
const session = {
	access_token: "token",
	refresh_token: "refresh",
	expires_in: 3600,
	token_type: "bearer",
	user: { id: "00000000-0000-4000-8000-000000000001" },
} as unknown as Session;
/* eslint-enable camelcase */

describe("useAuthStore", () => {
	beforeEach(() => {
		useAuthStore.setState({ restoring: true, session: null });
	});

	it("starts restoring with no session", () => {
		expect(useAuthStore.getState()).toMatchObject({
			restoring: true,
			session: null,
		});
	});

	it("records a session and stops restoring", () => {
		useAuthStore.getState().restore(session);
		expect(useAuthStore.getState()).toMatchObject({
			restoring: false,
			session,
		});
	});

	it("records a sign-out as a null session", () => {
		useAuthStore.getState().restore(session);
		useAuthStore.getState().restore(null);
		expect(useAuthStore.getState()).toMatchObject({
			restoring: false,
			session: null,
		});
	});
});
