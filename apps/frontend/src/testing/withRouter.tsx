import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import type { ReactElement } from "react";

/** Renders an element inside a throwaway memory router so router Links resolve without the app's route tree. */
export const withRouter = (element: ReactElement): ReactElement => {
	const router = createRouter({
		routeTree: createRootRoute({ component: (): ReactElement => element }),
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	return <RouterProvider router={router} />;
};
