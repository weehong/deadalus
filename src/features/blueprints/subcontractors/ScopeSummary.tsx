import { useTranslation } from "react-i18next";
import type { ScopeAssignment, Subcontractor, Unit } from "../data/database";
import { deriveCoverage, deriveScopeSheet } from "./model";
export const ScopeSummary = ({
	assignments,
	selected,
	units,
}: {
	assignments: Array<ScopeAssignment>;
	selected: Subcontractor;
	units: Array<Unit>;
}) => {
	const { t } = useTranslation();
	const sheet = deriveScopeSheet(selected.id, units, assignments);
	const coverage = deriveCoverage(units, assignments);
	return (
		<div className="grid gap-6 md:grid-cols-2">
			<section>
				<h2>{t("blueprints.scope.sheet")}</h2>
				{sheet.length === 0 ? (
					<p>{t("blueprints.scope.none")}</p>
				) : (
					sheet.map(({ unit, codes }) => (
						<p key={unit.id}>
							<strong>{unit.code}</strong>: {codes.join(", ")}
						</p>
					))
				)}
			</section>
			<section aria-label={t("blueprints.scope.coverage")}>
				<h2>{t("blueprints.scope.coverage")}</h2>
				<dl>
					<dt>{t("blueprints.scope.covered")}</dt>
					<dd>{coverage.covered}</dd>
					<dt>{t("blueprints.scope.unassigned")}</dt>
					<dd>{coverage.unassigned}</dd>
					<dt>{t("blueprints.scope.doubleAssigned")}</dt>
					<dd>{coverage.doubleAssigned}</dd>
				</dl>
			</section>
		</div>
	);
};
