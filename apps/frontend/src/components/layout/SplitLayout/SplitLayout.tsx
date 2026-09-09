import type { ReactNode } from "react";

/**
 * The two-column composition: an aside panel and a centred content column,
 * equal widths, collapsing to one column when either would drop under 320px.
 */
export const SplitLayout = ({
	aside,
	children,
}: {
	aside: ReactNode;
	children: ReactNode;
}): React.ReactElement => (
	<main className="grid min-h-screen grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-stretch">
		<aside className="min-h-[60vh]">{aside}</aside>
		<section className="grid place-items-center p-[clamp(24px,5vw,72px)]">
			{children}
		</section>
	</main>
);
