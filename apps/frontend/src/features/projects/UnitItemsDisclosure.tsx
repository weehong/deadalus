import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ItemRow, type SubcontractorChoice } from "@/features/projects/ItemRow";
import type { UnitItem } from "@/common/items";
/**
 * The Unit card's Items disclosure: closed until asked, then the Unit's
 * Items with a Subcontractor select on each for a single Assignment and,
 * beneath each, whatever `renderItemDetails` gives (the entry form and History).
 */
export const UnitItemsDisclosure = ({
	open,
	items,
	loading = false,
	error,
	subcontractors,
	pendingItemId,
	assignError,
	renderItemDetails,
	onToggle,
	onRetry,
	onAssign,
}: {
	open: boolean;
	/** The Unit's Items once read; undefined while loading or failed. */
	items?: Array<UnitItem>;
	loading?: boolean;
	error?: string;
	subcontractors: Array<SubcontractorChoice>;
	/** The Item whose Assignment is being changed. */
	pendingItemId?: string;
	assignError?: string;
	/** Rendered beneath each Item's row. */
	renderItemDetails?: (item: UnitItem) => ReactNode;
	onToggle: () => void;
	onRetry?: () => void;
	onAssign: (item: UnitItem, subcontractorId: string | null) => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const panelId = useId();
	return (
		<div>
			<Button
				aria-controls={open ? panelId : undefined}
				aria-expanded={open}
				variant="ghost"
				onClick={onToggle}
			>
				{t("projects.unitItems.toggle")}
			</Button>
			{open && (
				<div className="mt-2 grid gap-2" id={panelId}>
					{loading && (
						<p className="m-0 text-sm" role="status">
							{t("projects.unitItems.loading")}
						</p>
					)}
					{error && (
						<Alert>
							<p className="m-0 mb-2">{error}</p>
							<Button variant="secondary" onClick={onRetry}>
								{t("projects.unitItems.retry")}
							</Button>
						</Alert>
					)}
					{assignError && <Alert>{assignError}</Alert>}
					{items && items.length === 0 && (
						<p className="m-0 text-sm">{t("projects.unitItems.empty")}</p>
					)}
					{items && items.length > 0 && (
						<ul className="m-0 list-none divide-y divide-rule p-0">
							{items.map((item) => (
								<li key={item.id}>
									<ItemRow
										item={item}
										pending={pendingItemId === item.id}
										subcontractors={subcontractors}
										onAssign={(subcontractorId): void => {
											onAssign(item, subcontractorId);
										}}
									>
										{renderItemDetails?.(item)}
									</ItemRow>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
};
