import { Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { CatalogueItem } from "@/features/projects/types";
interface CatalogueItemsTableProps {
	catalogueItems: Array<CatalogueItem>;
	renderActions?: (catalogueItem: CatalogueItem) => ReactNode;
	renderEditor?: (catalogueItem: CatalogueItem) => ReactNode;
	footer?: ReactNode;
}
/** The Item Catalogue: each Catalogue Item with how many Units hold an Item made from it. */
export const CatalogueItemsTable = ({
	catalogueItems,
	renderActions,
	renderEditor,
	footer,
}: CatalogueItemsTableProps): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<div className="min-w-0 border border-rule">
			<table className="w-full table-fixed text-left text-sm">
				<thead>
					<tr>
						<th className="border-b border-rule p-3 break-words" scope="col">
							{t("projects.items.name")}
						</th>
						<th className="border-b border-rule p-3 break-words" scope="col">
							{t("projects.items.unitsHolding")}
						</th>
						{renderActions && (
							<th className="border-b border-rule p-3" scope="col">
								{t("projects.detail.actions")}
							</th>
						)}
					</tr>
				</thead>
				<tbody>
					{catalogueItems.map((catalogueItem) => {
						const editor = renderEditor?.(catalogueItem);
						return (
							<Fragment key={catalogueItem.id}>
								<tr>
									<td className="p-3 break-words">{catalogueItem.name}</td>
									<td className="p-3">{catalogueItem.itemCount}</td>
									{renderActions && (
										<td className="p-3">{renderActions(catalogueItem)}</td>
									)}
								</tr>
								{editor && (
									<tr>
										<td colSpan={renderActions ? 3 : 2}>{editor}</td>
									</tr>
								)}
							</Fragment>
						);
					})}
				</tbody>
			</table>
			{catalogueItems.length === 0 && (
				<p className="p-4 text-sm">{t("projects.items.empty")}</p>
			)}
			{footer}
		</div>
	);
};
