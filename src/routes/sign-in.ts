import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignIn } from "@/pages/SignIn";

type SignInSearch = { redirect?: string };
export const Route = createFileRoute("/sign-in")({
	validateSearch: (search: Record<string, unknown>): SignInSearch => ({
		redirect:
			typeof search["redirect"] === "string" &&
			search["redirect"].startsWith("/") &&
			!search["redirect"].startsWith("//")
				? search["redirect"]
				: undefined,
	}),
	beforeLoad: ({ context }) => {
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
		if (context.session) throw redirect({ to: "/" });
	},
	component: SignIn,
});
