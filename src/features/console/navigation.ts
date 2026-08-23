import {
	ClipboardDocumentListIcon,
	Cog6ToothIcon,
	CubeIcon,
	SignalIcon,
	Squares2X2Icon,
	UsersIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

export type ConsolePath =
	| "/"
	| "/work-orders"
	| "/system-status"
	| "/assets"
	| "/operators"
	| "/settings";

export type ConsoleNavigationItem = {
	labelKey:
		| "nav.overview"
		| "nav.workOrders"
		| "nav.systemStatus"
		| "nav.assets"
		| "nav.operators"
		| "nav.settings";
	path: ConsolePath;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	/** Overview is current only on its own path; every other destination keeps nested pages current. */
	exact?: boolean;
	/** Placeholder until counts come from data. */
	count?: number;
};

// The one place the console's destinations are defined; the shell hands these to the sidebar.
export const consoleNavigation: ReadonlyArray<ConsoleNavigationItem> = [
	{ labelKey: "nav.overview", path: "/", icon: Squares2X2Icon, exact: true },
	{
		labelKey: "nav.workOrders",
		path: "/work-orders",
		icon: ClipboardDocumentListIcon,
		count: 148,
	},
	{
		labelKey: "nav.systemStatus",
		path: "/system-status",
		icon: SignalIcon,
		count: 2,
	},
	{ labelKey: "nav.assets", path: "/assets", icon: CubeIcon },
	{ labelKey: "nav.operators", path: "/operators", icon: UsersIcon },
	{ labelKey: "nav.settings", path: "/settings", icon: Cog6ToothIcon },
];
