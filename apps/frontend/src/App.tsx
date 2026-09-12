import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { observeAuth } from "@/auth/auth";
import { missingSupabaseEnvironmentVariables } from "@/auth/supabase";
import type { FunctionComponent } from "@/common/types";
import { BootLoadingState } from "@/components/ui/LoadingState";
import { TanStackDevelopmentTools } from "@/components/utils/development-tools/TanStackDevelopmentTools";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";
import type { TanstackRouter } from "@/main";
import { StartupConfigurationError } from "@/pages/StartupConfigurationError";
import { useAuthStore } from "@/store/useAuthStore";

const queryClient = new QueryClient();

type AppProps = { router: TanstackRouter };

const ConfiguredApp = ({ router }: AppProps): FunctionComponent => {
	const { restoring, restore, session } = useAuthStore();
	const {
		restoring: restoringMember,
		restore: restoreMember,
		session: memberSession,
	} = useMemberSessionStore();
	// One subscription to the provider's auth-state stream feeds the read model.
	useEffect(() => observeAuth(restore), [restore]);
	// The Member Session is Daedalus's own, read back from browser storage once.
	useEffect(() => {
		restoreMember();
	}, [restoreMember]);
	// Guards read the Sessions; re-run them whenever either changes.
	useEffect(() => {
		if (!restoring && !restoringMember) void router.invalidate();
	}, [restoring, restoringMember, router, session, memberSession]);
	if (restoring || restoringMember) return <BootLoadingState />;
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
