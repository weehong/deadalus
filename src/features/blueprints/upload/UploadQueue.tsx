import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { Table } from "@/components/ui/Table";
import { Tag, type TagTone } from "@/components/ui/Tag";
import { formatBytes, summarizeQueue, type UploadQueueItem } from "./model";

const tones: Record<UploadQueueItem["state"], TagTone> = {
	queued: "neutral",
	uploading: "warning",
	uploaded: "positive",
	failed: "warning",
};
export const UploadQueue = ({
	items,
	onRemove,
	onRetry,
}: {
	items: ReadonlyArray<UploadQueueItem>;
	onRemove: (id: string) => void;
	onRetry: (id: string) => void;
}) => {
	const { t } = useTranslation();
	return (
		<Table aria-label={t("blueprints.uploadScreen.queue")}>
			<thead>
				<tr>
					<th>{t("blueprints.uploadScreen.document")}</th>
					<th>{t("blueprints.uploadScreen.size")}</th>
					<th>{t("blueprints.uploadScreen.discipline")}</th>
					<th>{t("blueprints.uploadScreen.status")}</th>
					<th />
				</tr>
			</thead>
			<tbody>
				{items.map((item) => (
					<tr key={item.id}>
						<td>{item.file.name}</td>
						<td>{formatBytes(item.file.size)}</td>
						<td>
							{t(
								`blueprints.uploadScreen.disciplines.${item.metadata.discipline}` as "blueprints.uploadScreen.disciplines.Architectural",
								{ defaultValue: item.metadata.discipline }
							)}
						</td>
						<td>
							<Tag tone={tones[item.state]}>
								{item.state === "uploading"
									? `${Math.round(item.progress)}%`
									: t(`blueprints.uploadScreen.states.${item.state}`)}
							</Tag>
						</td>
						<td>
							{item.state === "queued" ? (
								<Button
									variant="ghost"
									onClick={() => {
										onRemove(item.id);
									}}
								>
									{t("blueprints.uploadScreen.remove")}
								</Button>
							) : item.state === "failed" ? (
								<Button
									variant="ghost"
									onClick={() => {
										onRetry(item.id);
									}}
								>
									{t("blueprints.uploadScreen.retry")}
								</Button>
							) : null}
						</td>
					</tr>
				))}
			</tbody>
		</Table>
	);
};
export const BatchSummary = ({
	items,
}: {
	items: ReadonlyArray<UploadQueueItem>;
}) => {
	const { t } = useTranslation();
	const summary = summarizeQueue(items);
	return (
		<dl className="grid grid-cols-3 gap-4 border border-rule bg-surface p-5">
			<div>
				<dt>{t("blueprints.uploadScreen.documents")}</dt>
				<dd>{summary.documents}</dd>
			</div>
			<div>
				<dt>{t("blueprints.uploadScreen.totalSize")}</dt>
				<dd>{formatBytes(summary.totalBytes)}</dd>
			</div>
			<div>
				<dt>{t("blueprints.uploadScreen.uploaded")}</dt>
				<dd>{formatBytes(summary.uploadedBytes)}</dd>
			</div>
		</dl>
	);
};
