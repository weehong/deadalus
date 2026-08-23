import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PageHeading } from "@/components/ui/PageHeading";
import {
	ACCEPTED_DRAWING_EXTENSIONS,
	MAX_DRAWING_BYTES,
	parseDrawingFilename,
	type UploadQueueItem,
} from "./model";
import { uploadDrawing } from "./resumable";
import { BatchSummary, UploadQueue } from "./UploadQueue";
import { blueprintKeys } from "@/features/blueprints/data/queryHooks";

const accepted = ".pdf,.dwg,.dxf,.rvt";
export const UploadDrawingsScreen = ({
	siteId = "00000000-0000-0000-0000-000000000000",
	siteName = "Site name",
}: {
	siteId?: string;
	siteName?: string;
}) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [items, setItems] = useState<Array<UploadQueueItem>>([]);
	const filesRef = useRef<HTMLInputElement>(null);
	const foldersRef = useRef<HTMLInputElement>(null);
	const update = (id: string, value: Partial<UploadQueueItem>) => {
		setItems((current) =>
			current.map((item) => (item.id === id ? { ...item, ...value } : item))
		);
	};
	const start = async (item: UploadQueueItem) => {
		update(item.id, { state: "uploading" });
		try {
			await uploadDrawing(siteId, item, (progress) => {
				update(item.id, { progress });
			});
			update(item.id, { progress: 100, state: "uploaded" });
			await queryClient.invalidateQueries({
				queryKey: blueprintKeys.entity("drawings", siteId),
			});
		} catch (error) {
			update(item.id, {
				error: error instanceof Error ? error.message : "Upload failed",
				state: "failed",
			});
		}
	};
	const add = (files: FileList | Array<File>) => {
		const valid = Array.from(files).filter(
			(file) =>
				ACCEPTED_DRAWING_EXTENSIONS.includes(
					file.name.split(".").pop()?.toLowerCase() as never
				) && file.size <= MAX_DRAWING_BYTES
		);
		const additions = valid.map((file) => ({
			id: crypto.randomUUID(),
			file,
			metadata: parseDrawingFilename(file.name),
			progress: 0,
			state: "queued" as const,
		}));
		setItems((current) => [...current, ...additions]);
		for (const item of additions) void start(item);
	};
	return (
		<section>
			<PageHeading context={siteName} title={t("blueprints.upload")} />
			<div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<div className="space-y-5">
					<div
						className="border-2 border-dashed border-steel-300 bg-surface p-10 text-center"
						onDragOver={(event) => {
							event.preventDefault();
						}}
						onDrop={(event) => {
							event.preventDefault();
							add(event.dataTransfer.files);
						}}
					>
						<p className="font-semibold">{t("blueprints.uploadScreen.drop")}</p>
						<p className="mt-2 text-sm text-steel-500">
							{t("blueprints.uploadScreen.formats")}
						</p>
						<div className="mt-5 flex justify-center gap-3">
							<Button
								variant="secondary"
								onClick={() => {
									filesRef.current?.click();
								}}
							>
								{t("blueprints.uploadScreen.chooseFiles")}
							</Button>
							<Button
								variant="secondary"
								onClick={() => {
									foldersRef.current?.click();
								}}
							>
								{t("blueprints.uploadScreen.chooseFolder")}
							</Button>
						</div>
						<input
							ref={filesRef}
							multiple
							accept={accepted}
							className="sr-only"
							type="file"
							onChange={(event) => {
								if (event.target.files) add(event.target.files);
							}}
						/>
						<input
							ref={foldersRef}
							multiple
							accept={accepted}
							className="sr-only"
							type="file"
							{...{ webkitdirectory: "" }}
							onChange={(event) => {
								if (event.target.files) add(event.target.files);
							}}
						/>
					</div>
					<UploadQueue
						items={items}
						onRemove={(id) => {
							setItems((current) => current.filter((item) => item.id !== id));
						}}
						onRetry={(id) => {
							const item = items.find((candidate) => candidate.id === id);
							if (item) void start(item);
						}}
					/>
					<Button
						variant="ghost"
						onClick={() => {
							setItems((current) =>
								current.filter((item) => item.state !== "uploaded")
							);
						}}
					>
						{t("blueprints.uploadScreen.clearFinished")}
					</Button>
				</div>
				<aside className="space-y-5">
					<BatchSummary items={items} />
					<div className="border border-rule bg-surface p-5">
						<h2 className="font-heading text-2xl uppercase">
							{t("blueprints.uploadScreen.nextStep")}
						</h2>
						<p className="my-3 text-sm">
							{t("blueprints.uploadScreen.nextStepDescription")}
						</p>
						<Link
							className="font-semibold text-signal-500 underline"
							to="/blueprints/structure"
						>
							{t("blueprints.structure")}
						</Link>
					</div>
				</aside>
			</div>
		</section>
	);
};
