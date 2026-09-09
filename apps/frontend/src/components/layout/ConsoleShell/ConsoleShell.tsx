import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

type ConsoleShellProps = {
	children: ReactNode;
	/** Label for the top-bar button that closes the drawer. */
	closeMenuLabel: string;
	/** Label for the top-bar button that opens the drawer. */
	openMenuLabel: string;
	/**
	 * The current route's path. The drawer closes whenever it changes, so
	 * choosing an entry on a phone dismisses the menu without the shell
	 * knowing anything about the router.
	 */
	pathname?: string;
	/** The sidebar contents, normally a Sidebar. */
	sidebar: ReactNode;
	/** Accessible name for the sidebar landmark. */
	sidebarLabel: string;
};

/**
 * The Console frame. From the `md` breakpoint up, a 216px sidebar sticks to
 * the left of the content for the full viewport height. Below it, a slim top
 * bar carries the wordmark and a menu toggle, and the same sidebar opens as
 * an overlay drawer that closes on Escape, on the backdrop, or on navigation.
 */
export const ConsoleShell = ({
	children,
	closeMenuLabel,
	openMenuLabel,
	pathname,
	sidebar,
	sidebarLabel,
}: ConsoleShellProps): React.ReactElement => {
	const [open, setOpen] = useState(false);
	const [previousPathname, setPreviousPathname] = useState(pathname);
	const wasOpen = useRef(false);
	const sidebarId = useId();
	const asideRef = useRef<HTMLElement>(null);
	const toggleRef = useRef<HTMLButtonElement>(null);
	const close = (): void => {
		setOpen(false);
	};

	// Reset before rendering a new route, so its content never appears under
	// a stale open drawer. The effect below handles the resulting focus change.
	if (pathname !== previousPathname) {
		setPreviousPathname(pathname);
		setOpen(false);
	}

	useEffect(() => {
		if (open) asideRef.current?.focus();
		else if (wasOpen.current) toggleRef.current?.focus();
		wasOpen.current = open;
	}, [open]);

	return (
		<div className="min-h-screen md:flex">
			<header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-rule bg-canvas px-4 md:hidden">
				<Logo />
				<Button
					ref={toggleRef}
					aria-controls={sidebarId}
					aria-expanded={open}
					className="min-h-8 text-xs"
					variant="secondary"
					onClick={() => {
						if (open) close();
						else setOpen(true);
					}}
				>
					{open ? closeMenuLabel : openMenuLabel}
				</Button>
			</header>
			{open && (
				// The backdrop is a pointer affordance only; Escape and the toggle
				// serve keyboard and assistive users, so it is not a control itself.
				<div
					aria-hidden="true"
					className="fixed inset-0 z-20 bg-neutral-900/50 md:hidden"
					data-testid="console-backdrop"
					onClick={close}
				/>
			)}
			<aside
				ref={asideRef}
				aria-label={sidebarLabel}
				className={`w-[216px] flex-none border-r border-rule bg-canvas outline-none max-md:fixed max-md:bottom-0 max-md:top-16 max-md:left-0 max-md:z-30 md:sticky md:top-0 md:h-screen ${open ? "" : "max-md:hidden"}`}
				data-state={open ? "open" : "closed"}
				id={sidebarId}
				tabIndex={-1}
				onKeyDown={(event) => {
					if (event.key === "Escape" && open) close();
				}}
			>
				{sidebar}
			</aside>
			<main className="min-w-0 flex-1">{children}</main>
		</div>
	);
};
