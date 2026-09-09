import type { ComponentPropsWithRef } from "react";

/**
 * One entry in the Console navigation: a plain anchor, so a router can wrap
 * it. The active state is read from `aria-current="page"`, which TanStack
 * Router's Link sets on the matching route, and draws the accent rule.
 */
export const NavItem = ({
	className = "",
	...props
}: ComponentPropsWithRef<"a">): React.ReactElement => (
	<a
		{...props}
		className={`block border-l-[3px] border-transparent px-4 py-[9px] font-heading text-base tracking-[0.04em] text-ink no-underline hover:bg-accent-100 aria-[current=page]:border-accent aria-[current=page]:bg-accent-100 aria-[current=page]:text-accent-800 ${className}`}
	/>
);
