type LabelRowProps = { className?: string; labels: Array<string> };

/** An evenly spaced row of small uppercase labels above a top rule — the prototype's hierarchy strip. */
export const LabelRow = ({
	className = "",
	labels,
}: LabelRowProps): React.ReactElement => (
	<ul
		className={`m-0 grid list-none gap-2.5 border-t p-0 pt-2.5 text-[11px] uppercase tracking-[0.1em] ${className}`}
		style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
	>
		{labels.map((label) => (
			<li key={label}>{label}</li>
		))}
	</ul>
);
