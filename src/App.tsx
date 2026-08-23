import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { observeAuth } from "@/auth/auth";
import { useAuthStore } from "@/store/useAuthStore";
import type { FunctionComponent } from "@/common/types";
import type { TanstackRouter } from "@/main";
import { TanStackDevelopmentTools } from "@/components/utils/development-tools/TanStackDevelopmentTools";

const queryClient = new QueryClient();

type AppProps = { router: TanstackRouter };

const App = ({ router }: AppProps): FunctionComponent => {
	const { restoring, restore, session } = useAuthStore();
	useEffect(() => observeAuth(restore), [restore]);
	if (restoring) return <div className="flex min-h-screen items-center justify-center bg-canvas text-ink" role="status">Restoring session…</div>;
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider context={{ session }} router={router} />
			<TanStackDevelopmentTools router={router} />
		</QueryClientProvider>
	);
};

export default App;
