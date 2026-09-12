import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { FieldQueryState } from "@/features/field/FieldQueryState";
import { FieldRowList } from "@/features/field/FieldRowList";
import { useFieldProjectsQuery } from "@/features/field/useFieldProjectsQuery";

/**
 * The Field's Projects screen: every Project where the Member's
 * Subcontractor holds Items, with its own Progression there. The API does
 * the scoping; with nothing assigned the screen says so.
 */
export const FieldProjectsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const query = useFieldProjectsQuery();
	return (
		<>
			<header className="mb-6">
				<p className="m-0 text-[11px] tracking-[0.16em] uppercase text-accent-700">
					{t("field.projects.kicker")}
				</p>
				<h1 className="m-0 text-[28px]">{t("field.projects.heading")}</h1>
			</header>
			<FieldQueryState
				error={t("field.projects.error")}
				loading={t("field.projects.loading")}
				query={query}
				retry={t("field.projects.retry")}
			>
				{(projects): React.ReactElement =>
					projects.length === 0 ? (
						<div className="border border-rule p-6">
							<p className="m-0 text-[15px] text-ink/70">
								{t("field.projects.empty")}
							</p>
						</div>
					) : (
						<FieldRowList
							label={t("field.projects.listLabel")}
							rows={projects.map((project) => ({
								id: project.id,
								code: project.code,
								name: project.name,
								itemCount: project.itemCount,
								progression: project.progression,
								link: { to: "project", id: project.id },
							}))}
						/>
					)
				}
			</FieldQueryState>
		</>
	);
};
