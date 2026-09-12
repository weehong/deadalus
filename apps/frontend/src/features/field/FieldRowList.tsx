import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ProgressionBadge } from "@/components/progress/ProgressionBadge";

/**
 * Where a Field row leads: a Project (optionally with a Block or Storey
 * selected in the search params), or a Unit's own screen.
 */
export type FieldRowLink =
	| {
			to: "project";
			id: string;
			search?: { block?: string; storey?: string };
	  }
	| { to: "unit"; unitId: string };

export interface FieldRow {
	id: string;
	name: string;
	/** A Project's code, shown above its name. */
	code?: string;
	/** The Subcontractor's Items beneath this row; never zero, an empty node is never listed. */
	itemCount: number;
	/** The Subcontractor's own Progression beneath this row. */
	progression: number;
	link: FieldRowLink;
}

const rowClassName =
	"flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-ink no-underline hover:bg-surface active:bg-ink/7";

const RowLink = ({
	link,
	children,
}: {
	link: FieldRowLink;
	children: ReactNode;
}): React.ReactElement =>
	link.to === "unit" ? (
		<Link
			className={rowClassName}
			params={{ unitId: link.unitId }}
			to="/field/units/$unitId"
		>
			{children}
		</Link>
	) : (
		<Link
			className={rowClassName}
			params={{ id: link.id }}
			search={link.search ?? {}}
			to="/field/projects/$id"
		>
			{children}
		</Link>
	);

/**
 * One node of the Field as a single column of thumb-sized rows: the
 * Projects, or the Blocks, Storeys or Units of one, each with the
 * Subcontractor's Item count and Progression. The whole row is the link.
 */
export const FieldRowList = ({
	label,
	rows,
}: {
	/** Names the list for assistive technology: Projects, Blocks, Storeys or Units. */
	label: string;
	rows: Array<FieldRow>;
}): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<ul aria-label={label} className="m-0 list-none border border-rule p-0">
			{rows.map((row) => (
				<li key={row.id} className="border-b border-rule last:border-0">
					<RowLink link={row.link}>
						<span className="min-w-0 flex-1 break-words">
							{row.code !== undefined && (
								<span className="block text-[11px] tracking-[0.16em] uppercase text-accent-700">
									{row.code}
								</span>
							)}
							<span className="block font-heading text-base font-semibold">
								{row.name}
							</span>
							<span className="block text-sm text-ink/70">
								{t("field.rows.items", { count: row.itemCount })}
							</span>
						</span>
						<ProgressionBadge progression={row.progression} />
					</RowLink>
				</li>
			))}
		</ul>
	);
};
