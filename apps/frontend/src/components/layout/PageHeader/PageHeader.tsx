import type { ReactNode } from "react";

type PageHeaderProps = {
	/** Controls for the screen, right-aligned; wrap under the heading when narrow. */
	actions?: ReactNode;
	heading: string;
	/** The small uppercase line above the heading. */
	kicker?: string;
};

/** The head row of a Console screen: kicker over the page heading, actions opposite. */
export const PageHeader = ({
	actions,
	heading,
	kicker,
}: PageHeaderProps): React.ReactElement => (
	<header className="mb-6 flex flex-wrap items-end justify-between gap-4">
		<div>
			{kicker && (
				<p className="m-0 text-[11px] tracking-[0.16em] uppercase text-accent-700">
					{kicker}
				</p>
			)}
			<h1 className="m-0 text-[28px]">{heading}</h1>
		</div>
		{actions && (
			<div className="flex flex-wrap items-center gap-3">{actions}</div>
		)}
	</header>
);
