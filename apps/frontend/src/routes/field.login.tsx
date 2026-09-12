import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { FieldSignInPage } from "@/features/field/FieldSignInPage";
import { fieldReturnTo } from "@/features/field/return-to";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

/**
 * The Field's Sign in. The guard reads the Member Session store directly
 * rather than router context, so a Session started a moment ago is seen by
 * the very next navigation. `redirect` carries where the Member was headed,
 * kept only when it is a Field path of its own (`fieldReturnTo`).
 */
export const Route = createFileRoute("/field/login")({
	validateSearch: z.object({
		redirect: z.string().optional().transform(fieldReturnTo),
	}),
	beforeLoad: ({ search }) => {
		// A Member already signed in is never asked to sign in twice.
		if (useMemberSessionStore.getState().session)
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
			throw search.redirect
				? redirect({ href: search.redirect })
				: redirect({ to: "/field" });
	},
	component: function FieldSignInRoute(): React.ReactElement {
		const { redirect: returnTo } = Route.useSearch();
		return <FieldSignInPage returnTo={returnTo} />;
	},
});
