import type { ReactNode } from "react";

export type PageHeadingProps = {
	actions?: ReactNode;
	context: ReactNode;
	title: ReactNode;
};

export const PageHeading = ({ actions, context, title }: PageHeadingProps) => (
	<header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
		<div>
			<h1 className="font-heading text-4xl font-semibold uppercase tracking-wide text-ink">
				{title}
			</h1>
			<p className="mt-1 text-sm text-steel-500">{context}</p>
		</div>
		{actions === undefined ? null : (
			<div className="flex flex-wrap gap-3">{actions}</div>
		)}
	</header>
);
