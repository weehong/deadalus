import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { observeAuth } from "@/auth/auth";
import { missingSupabaseEnvironmentVariables } from "@/auth/supabase";
import type { FunctionComponent } from "@/common/types";
import { BootLoadingState } from "@/components/ui/LoadingState";
import { TanStackDevelopmentTools } from "@/components/utils/development-tools/TanStackDevelopmentTools";
import type { TanstackRouter } from "@/main";
import { StartupConfigurationError } from "@/pages/StartupConfigurationError";
import { useAuthStore } from "@/store/useAuthStore";

const queryClient = new QueryClient();

type AppProps = { router: TanstackRouter };

const ConfiguredApp = ({ router }: AppProps): FunctionComponent => {
	const { restoring, restore, session } = useAuthStore();
	// One subscription to the provider's auth-state stream feeds the read model.
	useEffect(() => observeAuth(restore), [restore]);
	// Guards read `context.session`; re-run them whenever it changes.
	useEffect(() => {
		if (!restoring) void router.invalidate();
	}, [restoring, router, session]);
	if (restoring) return <BootLoadingState />;
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider context={{ session }} router={router} />
			<TanStackDevelopmentTools router={router} />
		</QueryClientProvider>
	);
};

const App = (props: AppProps): FunctionComponent =>
	missingSupabaseEnvironmentVariables.length > 0 ? (
		<StartupConfigurationError
			missingVariables={missingSupabaseEnvironmentVariables}
		/>
	) : (
		<ConfiguredApp {...props} />
	);

export default App;
