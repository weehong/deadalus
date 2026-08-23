import { Link } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import type { ConsolePath } from "@/features/console/navigation";

export type SidebarItemProps = {
	label: string;
	path: ConsolePath;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	exact?: boolean;
	count?: number;
};

const displayCount = (count: number) => (count > 999 ? "999+" : String(count));

export const SidebarItem = ({
	label,
	path,
	icon: Icon,
	exact = false,
	count,
}: SidebarItemProps) => {
	const countLabel = count === undefined ? undefined : displayCount(count);
	return (
		<Link
			activeOptions={{ exact }}
			aria-label={countLabel === undefined ? label : `${label}, ${countLabel}`}
			className="group flex min-h-10 items-center gap-3 border border-transparent px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
			to={path}
			activeProps={{
				className: "border-white/20 bg-white/10 text-white",
			}}
		>
			<Icon aria-hidden="true" className="size-4 shrink-0" />
			<span className="min-w-0 flex-1 truncate">{label}</span>
			{countLabel === undefined ? null : (
				<span
					aria-hidden="true"
					className="tabular-nums text-white/50 group-data-[status=active]:text-white"
				>
					{countLabel}
				</span>
			)}
		</Link>
	);
};
