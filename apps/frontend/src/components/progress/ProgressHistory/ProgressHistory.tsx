import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/common/format-date-time";
import type { ProgressEntry } from "@/common/items";
/**
 * An Item's History disclosure on the Unit card: closed until asked, then
 * every Progress entry in the order given (newest first from the API), each
 * with its value, author, moment and note.
 */
export const ProgressHistory = ({
	itemName,
	open,
	entries,
	loading = false,
	error,
	buttonClassName = "",
	onToggle,
	onRetry,
}: {
	itemName: string;
	open: boolean;
	/** The Item's history once read; undefined while loading or failed. */
	entries?: Array<ProgressEntry>;
	loading?: boolean;
	error?: string;
	/** Extra classes on the toggle and Retry; the Field sizes them for a thumb. */
	buttonClassName?: string;
	onToggle: () => void;
	onRetry?: () => void;
}): React.ReactElement => {
	const { t, i18n } = useTranslation();
	const panelId = useId();
	const author = (entry: ProgressEntry): string =>
		entry.subcontractorName
			? t("projects.progress.byMember", {
					name: entry.enteredByName,
					subcontractor: entry.subcontractorName,
				})
			: entry.enteredByKind === "administrator"
				? t("projects.progress.byAdministrator", { name: entry.enteredByName })
				: entry.enteredByName;
	return (
		<div>
			<Button
				aria-controls={open ? panelId : undefined}
				aria-expanded={open}
				className={buttonClassName}
				variant="ghost"
				onClick={onToggle}
			>
				{t("projects.progress.history")}
			</Button>
			{open && (
				<div className="mt-1 grid gap-1" id={panelId}>
					{loading && (
						<p className="m-0 text-sm" role="status">
							{t("projects.progress.historyLoading")}
						</p>
					)}
					{error && (
						<Alert>
							<p className="m-0 mb-2">{error}</p>
							<Button
								className={buttonClassName}
								variant="secondary"
								onClick={onRetry}
							>
								{t("projects.progress.retry")}
							</Button>
						</Alert>
					)}
					{entries && entries.length === 0 && (
						<p className="m-0 text-sm">{t("projects.progress.historyEmpty")}</p>
					)}
					{entries && entries.length > 0 && (
						<ol
							aria-label={t("projects.progress.historyFor", { name: itemName })}
							className="m-0 list-none divide-y divide-rule p-0"
						>
							{entries.map((entry) => (
								<li key={entry.id} className="py-1.5 text-sm">
									<p className="m-0">
										{t("projects.progress.entry", {
											value: entry.value,
											author: author(entry),
										})}
										{" · "}
										<time dateTime={entry.createdAt}>
											{formatDateTime(entry.createdAt, i18n.language)}
										</time>
									</p>
									{entry.note && (
										<p className="m-0 text-ink/70">{entry.note}</p>
									)}
								</li>
							))}
						</ol>
					)}
				</div>
			)}
		</div>
	);
};
