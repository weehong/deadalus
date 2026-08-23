import { Outlet } from "@tanstack/react-router";
import type { FunctionComponent } from "@/common/types";

// The frame every console screen renders inside. The sidebar and header land here in later steps.
export const ConsoleShell = (): FunctionComponent => (
	<div className="min-h-screen bg-canvas text-ink">
		<main className="p-12" id="content">
			<Outlet />
		</main>
	</div>
);
