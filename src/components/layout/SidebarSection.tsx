import { Link, useRouterState } from "@tanstack/react-router";
import type { SidebarItemProps } from "./SidebarItem";

export type SidebarSectionProps = Required<
	Pick<SidebarItemProps, "children" | "icon" | "label" | "path">
>;

export const SidebarSection = ({
	children,
	icon: Icon,
	label,
	path,
}: SidebarSectionProps) => {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const expanded =
		pathname === "/blueprints" || pathname.startsWith("/blueprints/");
	return (
		<div>
			<Link
				aria-expanded={expanded}
				className="flex min-h-10 items-center gap-3 border border-transparent px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
				to={path}
			>
				<Icon aria-hidden="true" className="size-4 shrink-0" />
				<span>{label}</span>
			</Link>
			{expanded ? (
				<ul aria-label={label} className="mt-1 space-y-1">
					{children.map((child) => (
						<li key={child.path}>
							<Link
								activeOptions={{ exact: child.path !== "/blueprints/units" }}
								className="block min-h-9 border-l border-white/20 py-2 pl-10 pr-3 text-sm text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
								to={child.path}
								activeProps={{
									className: "border-signal-400 bg-white/10 text-white",
								}}
							>
								{child.label}
							</Link>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
};
