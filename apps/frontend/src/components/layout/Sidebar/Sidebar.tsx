import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

type SidebarProps = {
	/** Everything pinned to the foot: account, language, sign out. */
	foot: ReactNode;
	/** Accessible name for the navigation landmark. */
	label: string;
	/** The entries, normally NavItems. */
	navigation: ReactNode;
	/** The line under the wordmark. */
	subtitle: string;
};

/**
 * The Console's left column: brand at the top, the navigation beneath it and
 * the foot pinned to the bottom. Purely presentational; the shell decides
 * where it sits and the feature wires its contents.
 */
export const Sidebar = ({
	foot,
	label,
	navigation,
	subtitle,
}: SidebarProps): React.ReactElement => (
	<div className="flex h-full flex-col py-6">
		<div className="px-4 pb-6">
			<Logo size="large" />
			<p className="mt-0.5 mb-0 text-[10px] tracking-[0.14em] uppercase text-accent-700">
				{subtitle}
			</p>
		</div>
		<nav aria-label={label} className="flex flex-col">
			{navigation}
		</nav>
		<div className="mt-auto flex flex-col gap-3 border-t border-rule px-4 pt-4">
			{foot}
		</div>
	</div>
);
