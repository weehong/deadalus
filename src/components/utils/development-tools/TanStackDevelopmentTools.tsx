import React from "react";
import type { TanstackRouter } from "@/main";
import { isProduction } from "@/common/utils";

// Unified TanStack Devtools shell (Router + Query panels) with the Vite
// Source Inspector enabled via `@tanstack/devtools-vite` in vite.config.ts.
// Lazily loaded so it is excluded from production bundles.
export const TanStackDevelopmentTools = isProduction
	? (): null => null
	: React.lazy<TanstackRouter extends never ? never : React.ComponentType<{ router: TanstackRouter }>>(() =>
			import("./TanStackDevelopmentToolsPanel").then((result) => ({
				default: result.TanStackDevelopmentToolsPanel,
			}))
		);
