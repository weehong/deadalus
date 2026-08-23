import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { SidebarItem, type SidebarItemProps } from "./SidebarItem";
import { SidebarSection } from "./SidebarSection";

export type SidebarProps = {
	items: ReadonlyArray<SidebarItemProps>;
	scope: string;
	status?: ReactNode;
	className?: string;
};

export const Sidebar = ({
	items,
	scope,
	status,
	className = "",
}: SidebarProps) => (
	<aside
		className={`flex h-full w-[236px] flex-col bg-steel-900 text-white ${className}`}
	>
		<div className="border-b border-white/10 px-6 py-7">
			<Logo className="text-white" />
			<p className="mt-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/50">
				{scope}
			</p>
		</div>
		<nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-5">
			<ul className="space-y-1">
				{items.map((item) => (
					<li key={item.path}>
						{item.children === undefined ? (
							<SidebarItem {...item} />
						) : (
							<SidebarSection {...item} children={item.children} />
						)}
					</li>
				))}
			</ul>
		</nav>
		{status}
	</aside>
);
