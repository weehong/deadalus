import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { UnitItem } from "@/common/items";
import { LatestEntryLine } from "@/components/progress/LatestEntryLine";
export interface SubcontractorChoice {
	id: string;
	name: string;
}
/**
 * One Item on the Unit card: name, Subcontractor or Unassigned, Progression,
 * a select for a single Assignment and the latest entry's value, author and
 * moment. Its children (the entry form and History) render beneath.
 */
export const ItemRow = ({
	item,
	subcontractors,
	pending = false,
	onAssign,
	children,
}: {
	item: UnitItem;
	/** The Directory rows offered; the Item's own Subcontractor is always among the options. */
	subcontractors: Array<SubcontractorChoice>;
	pending?: boolean;
	onAssign: (subcontractorId: string | null) => void;
	children?: ReactNode;
}): React.ReactElement => {
	const { t } = useTranslation();
	const selectId = useId();
	const current = item.subcontractor;
	const options =
		current && !subcontractors.some((entry) => entry.id === current.id)
			? [current, ...subcontractors]
			: subcontractors;
	return (
		<div className="grid gap-2 py-2">
			<div className="flex flex-wrap items-center gap-3">
				<div className="min-w-0 flex-1 break-words">
					<p className="m-0 font-semibold">{item.name}</p>
					<p className="m-0 text-sm">
						{current?.name ?? t("projects.unitItems.unassigned")}
					</p>
				</div>
				<p className="m-0 text-sm font-semibold tabular-nums">
					{t("projects.unitItems.progression", {
						value: Math.round(item.progression),
					})}
				</p>
				<label className="sr-only" htmlFor={selectId}>
					{t("projects.unitItems.subcontractor", { name: item.name })}
				</label>
				<select
					className="min-h-10 max-w-full border border-rule bg-surface px-2.5 text-sm"
					disabled={pending}
					id={selectId}
					value={current?.id ?? ""}
					onChange={(event) => {
						onAssign(event.target.value || null);
					}}
				>
					<option value="">{t("projects.unitItems.unassigned")}</option>
					{options.map((entry) => (
						<option key={entry.id} value={entry.id}>
							{entry.name}
						</option>
					))}
				</select>
			</div>
			<LatestEntryLine latest={item.latestEntry} />
			{children}
		</div>
	);
};
