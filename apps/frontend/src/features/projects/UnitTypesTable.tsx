import { Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { UnitType } from "@/features/projects/types";
interface UnitTypesTableProps {
	unitTypes: Array<UnitType>;
	renderActions?: (unitType: UnitType) => ReactNode;
	renderEditor?: (unitType: UnitType) => ReactNode;
	footer?: ReactNode;
}
export const UnitTypesTable = ({
	unitTypes,
	renderActions,
	renderEditor,
	footer,
}: UnitTypesTableProps): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<div className="min-w-0 border border-rule">
			<table className="w-full table-fixed text-left text-sm">
				<thead>
					<tr>
						{[
							t("projects.columns.code"),
							t("projects.detail.description"),
							t("projects.columns.units"),
						].map((heading) => (
							<th
								key={heading}
								className="border-b border-rule p-3 break-words"
								scope="col"
							>
								{heading}
							</th>
						))}
						{renderActions && (
							<th scope="col">{t("projects.detail.actions")}</th>
						)}
					</tr>
				</thead>
				<tbody>
					{unitTypes.map((unitType) => {
						const editor = renderEditor?.(unitType);
						return (
							<Fragment key={unitType.id}>
								<tr>
									<td className="p-3 break-words">{unitType.code}</td>
									<td className="p-3 break-words">
										{unitType.description ?? "—"}
									</td>
									<td className="p-3">{unitType.unitCount}</td>
									{renderActions && (
										<td className="p-3">{renderActions(unitType)}</td>
									)}
								</tr>
								{editor && (
									<tr>
										<td colSpan={renderActions ? 4 : 3}>{editor}</td>
									</tr>
								)}
							</Fragment>
						);
					})}
				</tbody>
			</table>
			{unitTypes.length === 0 && (
				<p className="p-4 text-sm">{t("projects.detail.emptyTypes")}</p>
			)}
			{footer}
		</div>
	);
};
