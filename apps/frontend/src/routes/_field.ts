import { createFileRoute, redirect } from "@tanstack/react-router";
import { FieldLayout } from "@/features/field/FieldLayout";
import { fieldReturnToHere } from "@/features/field/return-to";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

/**
 * Pathless layout: every Field screen sits under it, so the Member Session
 * check lives here once and the guarded component never mounts for a
 * visitor. Independent of the Console's `_console` guard: neither Session
 * satisfies the other. A visitor keeps the screen they asked for — a scanned
 * QR label, most often — in `redirect`, and Sign in returns them to it.
 */
export const Route = createFileRoute("/_field")({
	beforeLoad: ({ location }) => {
		if (!useMemberSessionStore.getState().session)
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
			throw redirect({
				to: "/field/login",
				search: { redirect: fieldReturnToHere(location) },
			});
	},
	component: FieldLayout,
});
