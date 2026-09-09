/* eslint-disable camelcase -- Provider fixtures retain Supabase's wire-format keys. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken, observeAuth, signIn, signOut } from "./auth";

const session = {
	access_token: "test-access-token",
	refresh_token: "test-refresh-token",
	token_type: "bearer",
	expires_in: 3600,
	user: {
		id: "00000000-0000-4000-8000-000000000001",
		email: "administrator@example.com",
		aud: "authenticated",
		role: "authenticated",
		app_metadata: {},
		user_metadata: {},
		created_at: "2026-01-01T00:00:00.000Z",
	},
};

describe("signOut through the provider", () => {
	let logoutStatus = 204;
	let cleanupStatus = 204;
	let unsubscribe = (): void => {};

	beforeEach(async () => {
		logoutStatus = 204;
		cleanupStatus = 204;
		vi.stubGlobal(
			"fetch",
			vi.fn((input: string): Promise<Response> => {
				if (input.includes("/token?grant_type=password")) {
					return Promise.resolve(Response.json(session));
				}
				if (input.includes("/logout")) {
					const status = input.includes("scope=local")
						? cleanupStatus
						: logoutStatus;
					if (status === 0)
						return Promise.reject(new TypeError("Failed to fetch"));
					return Promise.resolve(
						status === 204
							? new Response(null, { status: 204 })
							: Response.json({ message: "Provider unavailable" }, { status })
					);
				}
				throw new Error(`Unexpected provider request: ${input}`);
			})
		);
		await signIn(session.user.email, "test-password");
	});

	afterEach(async () => {
		unsubscribe();
		logoutStatus = 204;
		cleanupStatus = 204;
		await signOut();
		vi.unstubAllGlobals();
	});

	it.each([500, 0])(
		"keeps the Session after revocation failure %s and allows a retry",
		async (status) => {
			const onChange = vi.fn();
			unsubscribe = observeAuth(onChange);
			await vi.waitFor(() => {
				expect(onChange).toHaveBeenCalledWith(
					expect.objectContaining({ access_token: session.access_token })
				);
			});
			onChange.mockClear();
			logoutStatus = status;

			await expect(signOut()).rejects.toMatchObject({ kind: "Unavailable" });
			expect(await getAccessToken()).toBe(session.access_token);
			expect(onChange).not.toHaveBeenCalledWith(null);

			logoutStatus = 204;
			await signOut();
			expect(await getAccessToken()).toBeNull();
			expect(onChange).toHaveBeenCalledWith(null);
		}
	);

	it("ends the Session and notifies observers after successful revocation", async () => {
		const onChange = vi.fn();
		unsubscribe = observeAuth(onChange);

		await signOut();

		expect(await getAccessToken()).toBeNull();
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it.each([401, 403, 404])(
		"ends an already-invalid Session when revocation returns %s",
		async (status) => {
			const onChange = vi.fn();
			unsubscribe = observeAuth(onChange);
			logoutStatus = status;
			cleanupStatus = status;

			await expect(signOut()).resolves.toBeUndefined();

			expect(await getAccessToken()).toBeNull();
			expect(onChange).toHaveBeenCalledWith(null);
		}
	);

	it("finishes after revocation even when the SDK cleanup request fails", async () => {
		const onChange = vi.fn();
		unsubscribe = observeAuth(onChange);
		cleanupStatus = 500;

		await expect(signOut()).resolves.toBeUndefined();

		expect(await getAccessToken()).toBeNull();
		expect(onChange).toHaveBeenCalledWith(null);
	});
});
