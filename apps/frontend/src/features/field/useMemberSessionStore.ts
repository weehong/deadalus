import { create } from "zustand";
import type { FieldMember, MemberSession } from "@/features/field/types";

/** The one browser-storage key the Member Session is mirrored under. */
export const MEMBER_SESSION_STORAGE_KEY = "daedalus.field.session";

/** Why the last Session ended; Sign in shows a notice for an expiry. */
export type SessionEnd = "signedOut" | "expired";

/**
 * The Member Session read model. Daedalus issues the Session itself
 * (ADR-0009), so the store owns persistence: it mirrors the Session to local
 * storage under one key and reads it back once at boot. `restoring` is true
 * until that read has happened, so a reload never flashes Sign in at a Member
 * who is already signed in. Independent of the Administrator's Session.
 */
type MemberSessionState = {
	restoring: boolean;
	session: MemberSession | null;
	ended: SessionEnd | null;
	/** Read the stored Session at boot. */
	restore: () => void;
	/** Begin a Session after sign-in. */
	start: (session: MemberSession) => void;
	/** Refresh the Member from the API while keeping the token. */
	update: (member: FieldMember) => void;
	/** End the Session: Sign out, or a 401 from any Field request. */
	end: (reason: SessionEnd) => void;
};

const isMember = (value: unknown): value is FieldMember => {
	if (typeof value !== "object" || value === null) return false;
	const member = value as Partial<FieldMember>;
	return (
		typeof member.id === "string" &&
		typeof member.name === "string" &&
		typeof member.subcontractor === "object" &&
		member.subcontractor !== null &&
		typeof member.subcontractor.id === "string" &&
		typeof member.subcontractor.name === "string"
	);
};

const isSession = (value: unknown): value is MemberSession => {
	if (typeof value !== "object" || value === null) return false;
	const session = value as Partial<MemberSession>;
	return typeof session.token === "string" && isMember(session.member);
};

const clearStoredSession = (): void => {
	try {
		window.localStorage.removeItem(MEMBER_SESSION_STORAGE_KEY);
	} catch {
		// Nothing to clear if storage is unavailable.
	}
};

const readStoredSession = (): MemberSession | null => {
	try {
		const raw = window.localStorage.getItem(MEMBER_SESSION_STORAGE_KEY);
		if (raw === null) return null;
		const parsed: unknown = JSON.parse(raw);
		if (isSession(parsed)) return parsed;
	} catch {
		// Unreadable storage or malformed JSON: treat as signed out.
	}
	clearStoredSession();
	return null;
};

const writeStoredSession = (session: MemberSession): void => {
	try {
		window.localStorage.setItem(
			MEMBER_SESSION_STORAGE_KEY,
			JSON.stringify(session)
		);
	} catch {
		// Storage may be unavailable (private mode, quota); the in-memory
		// Session still serves this page load.
	}
};

export const useMemberSessionStore = create<MemberSessionState>((set, get) => ({
	restoring: true,
	session: null,
	ended: null,
	restore: (): void => {
		set({ restoring: false, session: readStoredSession() });
	},
	start: (session): void => {
		writeStoredSession(session);
		set({ restoring: false, session, ended: null });
	},
	update: (member): void => {
		const current = get().session;
		if (!current) return;
		const session = { token: current.token, member };
		writeStoredSession(session);
		set({ session });
	},
	end: (reason): void => {
		clearStoredSession();
		set({ restoring: false, session: null, ended: reason });
	},
}));
