import { useId, type ReactNode } from "react";
interface StructureRow {
	id: string;
	name: string;
	detail: string;
	/** Shown at the end of the row, inside its button: the row's Progression. */
	badge?: ReactNode;
}
interface StructurePaneProps {
	heading: string;
	emptyMessage: string;
	rows: Array<StructureRow>;
	selectedId?: string;
	actions?: ReactNode;
	children?: ReactNode;
	renderActions?: (id: string) => ReactNode;
	onSelect: (id: string) => void;
}
export const StructurePane = ({
	heading,
	emptyMessage,
	rows,
	selectedId,
	actions,
	children,
	renderActions,
	onSelect,
}: StructurePaneProps): React.ReactElement => {
	const headingId = useId();
	return (
		<section aria-labelledby={headingId} className="min-w-0 border border-rule">
			<header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule p-4">
				<h2 className="m-0 break-words text-xl" id={headingId}>
					{heading}
				</h2>
				{actions}
			</header>
			{children}
			<ul aria-labelledby={headingId} className="m-0 list-none p-0">
				{rows.map((row) => (
					<li key={row.id} className="border-b border-rule last:border-0">
						<button
							aria-current={selectedId === row.id ? "true" : undefined}
							className={`flex w-full items-start justify-between gap-3 p-4 text-left break-words ${selectedId === row.id ? "bg-ink text-canvas" : "hover:bg-surface"}`}
							type="button"
							onClick={(): void => {
								onSelect(row.id);
							}}
						>
							<span className="min-w-0">
								<span className="block font-semibold">{row.name}</span>{" "}
								<span className="text-sm">{row.detail}</span>
							</span>{" "}
							{row.badge}
						</button>
						{renderActions?.(row.id)}
					</li>
				))}
			</ul>
			{rows.length === 0 && <p className="p-4 text-sm">{emptyMessage}</p>}
		</section>
	);
};
