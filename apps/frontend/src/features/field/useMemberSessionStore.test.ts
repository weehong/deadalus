import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MemberSession } from "@/features/field/types";
import {
	MEMBER_SESSION_STORAGE_KEY,
	useMemberSessionStore,
} from "@/features/field/useMemberSessionStore";

const session: MemberSession = {
	token: "member-token",
	member: {
		id: "member-alex",
		name: "Alex Tan",
		subcontractor: { id: "acme", name: "Acme Joinery" },
	},
};

/** jsdom here exposes no storage; a memory-backed one stands in for the browser's. */
const memoryStorage = (): Storage => {
	const entries = new Map<string, string>();
	return {
		get length(): number {
			return entries.size;
		},
		clear: (): void => {
			entries.clear();
		},
		getItem: (key: string): string | null => entries.get(key) ?? null,
		key: (index: number): string | null => [...entries.keys()][index] ?? null,
		removeItem: (key: string): void => {
			entries.delete(key);
		},
		setItem: (key: string, value: string): void => {
			entries.set(key, value);
		},
	};
};

describe("useMemberSessionStore", () => {
	beforeEach(() => {
		vi.stubGlobal("localStorage", memoryStorage());
		useMemberSessionStore.setState({
			restoring: true,
			session: null,
			ended: null,
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("starts restoring with no Session", () => {
		expect(useMemberSessionStore.getState()).toMatchObject({
			restoring: true,
			session: null,
		});
	});

	it("restores nothing when storage is empty", () => {
		useMemberSessionStore.getState().restore();
		expect(useMemberSessionStore.getState()).toMatchObject({
			restoring: false,
			session: null,
		});
	});

	it("restores a stored Session at boot", () => {
		window.localStorage.setItem(
			MEMBER_SESSION_STORAGE_KEY,
			JSON.stringify(session)
		);
		useMemberSessionStore.getState().restore();
		expect(useMemberSessionStore.getState()).toMatchObject({
			restoring: false,
			session,
		});
	});

	it("discards a stored value that is not a Session", () => {
		window.localStorage.setItem(MEMBER_SESSION_STORAGE_KEY, '{"token":1}');
		useMemberSessionStore.getState().restore();
		expect(useMemberSessionStore.getState().session).toBeNull();
		expect(window.localStorage.getItem(MEMBER_SESSION_STORAGE_KEY)).toBeNull();
	});

	it("starts a Session and mirrors it to storage", () => {
		useMemberSessionStore.getState().start(session);
		expect(useMemberSessionStore.getState()).toMatchObject({
			restoring: false,
			session,
			ended: null,
		});
		expect(
			JSON.parse(window.localStorage.getItem(MEMBER_SESSION_STORAGE_KEY)!)
		).toEqual(session);
	});

	it("updates the Member while keeping the token", () => {
		useMemberSessionStore.getState().start(session);
		const renamed = { ...session.member, name: "Alexandra Tan" };
		useMemberSessionStore.getState().update(renamed);
		expect(useMemberSessionStore.getState().session).toEqual({
			token: "member-token",
			member: renamed,
		});
		expect(
			JSON.parse(window.localStorage.getItem(MEMBER_SESSION_STORAGE_KEY)!)
		).toEqual({ token: "member-token", member: renamed });
	});

	it("ends the Session, clears storage and remembers why", () => {
		useMemberSessionStore.getState().start(session);
		useMemberSessionStore.getState().end("expired");
		expect(useMemberSessionStore.getState()).toMatchObject({
			restoring: false,
			session: null,
			ended: "expired",
		});
		expect(window.localStorage.getItem(MEMBER_SESSION_STORAGE_KEY)).toBeNull();
	});
});
