import { useTranslation } from "react-i18next";
import type { FieldUnitItems } from "@/features/field/types";
import type { FunctionComponent } from "@/common/types";
import { ProgressEntryPanel } from "@/components/progress/ProgressEntryPanel";
import { FieldBackLink } from "@/features/field/FieldBackLink";
import { FieldItemRow } from "@/features/field/FieldItemRow";
import { FieldQueryState } from "@/features/field/FieldQueryState";
import { useFieldProgressEntriesQuery } from "@/features/field/useFieldProgressEntriesQuery";
import { useEnterFieldProgress } from "@/features/field/useFieldProgressEntryMutations";
import { useFieldUnitItemsQuery } from "@/features/field/useFieldUnitItemsQuery";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

/** The Field's thumb preset: every control and button on the entry panel is 44px tall, the inputs a size up. */
const THUMB_CONTROL = "h-[44px] text-base";
const THUMB_BUTTON = "h-[44px]";

/**
 * The Unit's screen: a heading of Project code, Block, Storey and Unit,
 * then the Subcontractor's Items there, each with its Progression, its
 * latest entry, an "Enter progress" form and a History disclosure. Only
 * the Member's Subcontractor's Items arrive from the API; a Unit where it
 * holds nothing is a 404, worded for the scan that most often brings a
 * Member here and shown with a way back.
 */
export const FieldUnitPage = ({
	unitId,
}: {
	unitId: string;
}): FunctionComponent => {
	const { t } = useTranslation();
	const query = useFieldUnitItemsQuery(unitId);
	const enter = useEnterFieldProgress(unitId);
	// The layout guarantees a Session; the not-found copy names the company.
	const subcontractor = useMemberSessionStore(
		(state) => state.session?.member.subcontractor.name ?? ""
	);
	return (
		<FieldQueryState
			error={t("field.unit.error")}
			loading={t("field.unit.loading")}
			query={query}
			retry={t("field.unit.retry")}
			notFound={{
				message: t("field.unit.notFound", { subcontractor }),
				back: (
					<FieldBackLink
						label={t("field.project.backToProjects")}
						target={{ to: "projects" }}
					/>
				),
			}}
		>
			{({ project, block, storey, unit, items }): React.ReactElement => (
				<>
					<nav className="mb-2">
						<FieldBackLink
							label={t("field.unit.backToUnits")}
							target={{
								to: "project",
								id: project.id,
								search: { block: block.id, storey: storey.id },
							}}
						/>
					</nav>
					<header className="mb-6">
						<p className="m-0 text-[11px] tracking-[0.16em] uppercase text-accent-700">
							{[
								project.code,
								t("field.project.block", { name: block.name }),
								t("field.project.storey", { name: storey.name }),
							].join(" · ")}
						</p>
						<h1 className="m-0 break-words text-[28px]">
							{t("field.unit.heading", { name: unit.name })}
						</h1>
					</header>
					<p className="m-0 mb-2 text-[11px] tracking-[0.16em] uppercase text-ink/60">
						{t("field.unit.items")}
					</p>
					<ul
						aria-label={t("field.unit.items")}
						className="m-0 list-none divide-y divide-rule border border-rule p-0"
					>
						{items.map((item) => (
							<li key={item.id} className="px-4">
								<FieldItemRow item={item}>
									<ProgressEntryPanel
										buttonClassName={THUMB_BUTTON}
										controlClassName={THUMB_CONTROL}
										item={item}
										useHistory={useFieldProgressEntriesQuery}
										pending={
											enter.isPending && enter.variables.itemId === item.id
										}
										onEnter={(itemId, input): Promise<FieldUnitItems> =>
											enter.mutateAsync({ itemId, ...input })
										}
									/>
								</FieldItemRow>
							</li>
						))}
					</ul>
				</>
			)}
		</FieldQueryState>
	);
};
