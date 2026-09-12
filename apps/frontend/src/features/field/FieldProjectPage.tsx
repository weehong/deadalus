import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { FieldBackLink } from "@/features/field/FieldBackLink";
import { FieldQueryState } from "@/features/field/FieldQueryState";
import { FieldRowList, type FieldRow } from "@/features/field/FieldRowList";
import type { FieldProjectSearch } from "@/features/field/types";
import { useFieldProjectQuery } from "@/features/field/useFieldProjectQuery";

/** One node of the walk: a back link, the node's heading, and its children as rows. */
const FieldNodeScreen = ({
	back,
	kicker,
	heading,
	listLabel,
	rows,
}: {
	back: ReactNode;
	kicker: string;
	heading: string;
	listLabel: string;
	rows: Array<FieldRow>;
}): React.ReactElement => (
	<>
		<nav className="mb-2">{back}</nav>
		<header className="mb-6">
			<p className="m-0 text-[11px] tracking-[0.16em] uppercase text-accent-700">
				{kicker}
			</p>
			<h1 className="m-0 break-words text-[28px]">{heading}</h1>
		</header>
		<p className="m-0 mb-2 text-[11px] tracking-[0.16em] uppercase text-ink/60">
			{listLabel}
		</p>
		<FieldRowList label={listLabel} rows={rows} />
	</>
);

/**
 * The drill-down: the Blocks of a Project, then the Storeys of the selected
 * Block, then the Units of the selected Storey, one node per screen with
 * the selection in the search params so any screen can be shared or reloaded.
 * Only the nodes where the Subcontractor holds Items arrive from the API; a
 * Project where it holds nothing is a 404, shown with a way back.
 */
export const FieldProjectPage = ({
	id,
	search,
}: {
	id: string;
	search: FieldProjectSearch;
}): FunctionComponent => {
	const { t } = useTranslation();
	const query = useFieldProjectQuery(id);
	return (
		<FieldQueryState
			error={t("field.project.error")}
			loading={t("field.project.loading")}
			query={query}
			retry={t("field.project.retry")}
			notFound={{
				message: t("field.project.notFound"),
				back: (
					<FieldBackLink
						label={t("field.project.backToProjects")}
						target={{ to: "projects" }}
					/>
				),
			}}
		>
			{(project): React.ReactElement => {
				// A stale selection (a Block or Storey no longer holding our Items) falls back a node.
				const block = project.blocks.find((entry) => entry.id === search.block);
				const storey = block?.storeys.find(
					(entry) => entry.id === search.storey
				);

				if (block && storey) {
					return (
						<FieldNodeScreen
							heading={t("field.project.storey", { name: storey.name })}
							kicker={`${project.code} · ${t("field.project.block", { name: block.name })}`}
							listLabel={t("field.project.units")}
							back={
								<FieldBackLink
									label={t("field.project.backToStoreys")}
									target={{ to: "project", id, search: { block: block.id } }}
								/>
							}
							rows={storey.units.map((unit) => ({
								id: unit.id,
								name: unit.name,
								itemCount: unit.itemCount,
								progression: unit.progression,
								link: { to: "unit", unitId: unit.id },
							}))}
						/>
					);
				}

				if (block) {
					return (
						<FieldNodeScreen
							heading={t("field.project.block", { name: block.name })}
							kicker={`${project.code} · ${project.name}`}
							listLabel={t("field.project.storeys")}
							back={
								<FieldBackLink
									label={t("field.project.backToBlocks")}
									target={{ to: "project", id }}
								/>
							}
							rows={block.storeys.map((entry) => ({
								id: entry.id,
								name: entry.name,
								itemCount: entry.itemCount,
								progression: entry.progression,
								link: {
									to: "project",
									id,
									search: { block: block.id, storey: entry.id },
								},
							}))}
						/>
					);
				}

				return (
					<FieldNodeScreen
						heading={project.name}
						kicker={project.code}
						listLabel={t("field.project.blocks")}
						back={
							<FieldBackLink
								label={t("field.project.backToProjects")}
								target={{ to: "projects" }}
							/>
						}
						rows={project.blocks.map((entry) => ({
							id: entry.id,
							name: entry.name,
							itemCount: entry.itemCount,
							progression: entry.progression,
							link: { to: "project", id, search: { block: entry.id } },
						}))}
					/>
				);
			}}
		</FieldQueryState>
	);
};
