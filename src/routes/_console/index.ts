import { createFileRoute, redirect } from "@tanstack/react-router";
import { Home } from "@/pages/Home";

export const Route = createFileRoute("/")({
	beforeLoad: ({ context, location }) => {
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
		if (!context.session) throw redirect({ to: "/sign-in", search: { redirect: location.href } });
	},
	component: Home,
});
