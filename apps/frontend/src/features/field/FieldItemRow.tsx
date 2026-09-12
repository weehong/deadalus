import type { ReactNode } from "react";
import type { UnitItem } from "@/common/items";
import { LatestEntryLine } from "@/components/progress/LatestEntryLine";
import { ProgressionBadge } from "@/components/progress/ProgressionBadge";

/**
 * One of the Subcontractor's Items on the Field's Unit screen: its name as
 * a heading, its Progression and its latest entry's value, author and
 * moment. Every Item here is the Member's own Subcontractor's, so unlike
 * the Console's row it names no Subcontractor and offers no Assignment.
 * Its children (the entry form and History) render beneath.
 */
export const FieldItemRow = ({
	item,
	children,
}: {
	item: UnitItem;
	children?: ReactNode;
}): React.ReactElement => (
	<div className="grid gap-3 py-4">
		<div className="flex items-start gap-3">
			<h2 className="m-0 min-w-0 flex-1 break-words font-heading text-lg font-semibold leading-tight">
				{item.name}
			</h2>
			<ProgressionBadge progression={item.progression} />
		</div>
		<LatestEntryLine latest={item.latestEntry} />
		{children}
	</div>
);
