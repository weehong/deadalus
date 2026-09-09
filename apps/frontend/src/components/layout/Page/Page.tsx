import type { ReactNode } from "react";

/** The Console content column: centred, capped at 1400px, with the system's page padding. */
export const Page = ({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}): React.ReactElement => (
	<div className={`mx-auto w-full max-w-[1400px] px-4 pt-8 pb-20 ${className}`}>
		{children}
	</div>
);
