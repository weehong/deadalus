import { createFileRoute, redirect } from "@tanstack/react-router";
import { Login } from "@/pages/Login";

export const Route = createFileRoute("/login")({
	beforeLoad: ({ context }) => {
		// Someone already signed in is never asked to authenticate twice.
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
		if (context.session) throw redirect({ to: "/" });
	},
	component: Login,
});
