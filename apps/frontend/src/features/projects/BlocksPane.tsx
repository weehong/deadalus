import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/common/api";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { StructurePane } from "@/features/projects/StructurePane";
import { BatchNamesForm } from "@/features/projects/BatchNamesForm";
import { nameKey } from "@/features/projects/name-generator";
import type { Block } from "@/features/projects/types";
export const BlocksPane = ({
	blocks,
	extraActions,
	selectedId,
	pending = false,
	error,
	onAdd,
	onRename,
	onDelete,
	onSelect,
}: {
	blocks: Array<Block>;
	extraActions?: React.ReactNode;
	selectedId?: string;
	pending?: boolean;
	error?: string;
	onAdd: (names: Array<string>) => Promise<unknown>;
	onRename: (blockId: string, name: string) => Promise<unknown>;
	onDelete: (blockId: string) => Promise<unknown>;
	onSelect: (blockId: string) => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const [mode, setMode] = useState<"add" | "many" | undefined>();
	const [name, setName] = useState("");
	const [renaming, setRenaming] = useState<string>();
	const [rename, setRename] = useState("");
	const [deleting, setDeleting] = useState<Block>();
	const [failure, setFailure] = useState<string>();
	const addButton = useRef<HTMLButtonElement>(null);
	const report = (error: unknown): void => {
		const details =
			error instanceof ApiRequestError ? error.details : undefined;
		const names =
			details &&
			typeof details === "object" &&
			"names" in details &&
			Array.isArray(details.names)
				? details.names.filter(
						(entry): entry is string => typeof entry === "string"
					)
				: [];
		setFailure(
			names.length
				? t("projects.blocks.clash", { names: names.join(", ") })
				: t("projects.blocks.error")
		);
	};
	const run = async (
		work: () => Promise<unknown>,
		done: () => void
	): Promise<void> => {
		setFailure(undefined);
		try {
			await work();
			done();
		} catch (error) {
			report(error);
		}
	};
	const cancel = (): void => {
		setMode(undefined);
		setFailure(undefined);
		addButton.current?.focus();
	};
	return (
		<StructurePane
			emptyMessage={t("projects.detail.emptyBlocks")}
			heading={t("projects.detail.blocks")}
			selectedId={selectedId}
			actions={
				<div className="flex flex-wrap gap-2">
					{extraActions}
					<Button
						ref={addButton}
						disabled={pending}
						variant="secondary"
						onClick={(): void => {
							setMode("add");
							setFailure(undefined);
						}}
					>
						{t("projects.blocks.add")}
					</Button>
					<Button
						disabled={pending}
						variant="secondary"
						onClick={(): void => {
							setMode("many");
							setFailure(undefined);
						}}
					>
						{t("projects.blocks.many")}
					</Button>
				</div>
			}
			renderActions={(id): React.ReactNode => {
				const block = blocks.find((entry) => entry.id === id)!;
				return renaming === id ? (
					<form
						className="space-y-2 p-3"
						onSubmit={(event): void => {
							event.preventDefault();
							if (
								rename.trim() &&
								!blocks.some(
									(entry) =>
										entry.id !== id && nameKey(entry.name) === nameKey(rename)
								)
							)
								void run(
									() => onRename(id, rename.trim()),
									() => {
										setRenaming(undefined);
									}
								);
						}}
					>
						<label>
							{t("projects.blocks.name")}
							<input
								autoFocus
								required
								className="w-full border border-rule p-2"
								disabled={pending}
								maxLength={60}
								value={rename}
								onChange={(event): void => {
									setRename(event.target.value);
								}}
							/>
						</label>
						<Button
							pending={pending}
							type="submit"
							disabled={
								!rename.trim() ||
								blocks.some(
									(entry) =>
										entry.id !== id && nameKey(entry.name) === nameKey(rename)
								)
							}
						>
							{t("projects.blocks.save")}
						</Button>
						<Button
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								setRenaming(undefined);
							}}
						>
							{t("projects.batch.cancel")}
						</Button>
					</form>
				) : (
					<div className="flex gap-2 px-3 pb-3">
						<Button
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								setRenaming(id);
								setRename(block.name);
								setFailure(undefined);
							}}
						>
							{t("projects.blocks.rename")}
						</Button>
						<Button
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								setDeleting(block);
								setFailure(undefined);
							}}
						>
							{t("projects.blocks.delete")}
						</Button>
					</div>
				);
			}}
			rows={blocks.map((block) => ({
				id: block.id,
				name: block.name,
				detail: t("projects.detail.blockCounts", {
					storeys: block.storeys.length,
					units: block.storeys.reduce(
						(total, storey) => total + storey.units.length,
						0
					),
				}),
			}))}
			onSelect={onSelect}
		>
			{mode === "many" && (
				<BatchNamesForm
					error={failure ?? error}
					existingNames={blocks.map((block) => block.name)}
					pending={pending}
					onCancel={cancel}
					onSubmit={(names): void => {
						void run(() => onAdd(names), cancel);
					}}
				/>
			)}
			{mode === "add" && (
				<form
					className="space-y-2 p-4"
					onSubmit={(event): void => {
						event.preventDefault();
						if (
							name.trim() &&
							!blocks.some((block) => nameKey(block.name) === nameKey(name))
						)
							void run(
								() => onAdd([name.trim()]),
								() => {
									setName("");
								}
							);
					}}
				>
					<label>
						{t("projects.blocks.name")}
						<input
							autoFocus
							required
							className="w-full border border-rule p-2"
							disabled={pending}
							maxLength={60}
							value={name}
							onChange={(event): void => {
								setName(event.target.value);
							}}
						/>
					</label>
					<Button
						pending={pending}
						type="submit"
						disabled={
							!name.trim() ||
							blocks.some((block) => nameKey(block.name) === nameKey(name))
						}
					>
						{t("projects.blocks.add")}
					</Button>
					<Button disabled={pending} variant="secondary" onClick={cancel}>
						{t("projects.batch.cancel")}
					</Button>
				</form>
			)}
			{mode !== "many" && !deleting && (failure ?? error) && (
				<Alert>{failure ?? error}</Alert>
			)}
			<Dialog
				open={Boolean(deleting)}
				title={t("projects.blocks.deleteTitle")}
				onClose={(): void => {
					if (!pending) setDeleting(undefined);
				}}
			>
				<p>
					{t("projects.blocks.deleteConfirm", {
						name: deleting?.name,
						storeys: deleting?.storeys.length ?? 0,
						units:
							deleting?.storeys.reduce(
								(total, storey) => total + storey.units.length,
								0
							) ?? 0,
					})}
				</p>
				{failure && <Alert>{failure}</Alert>}
				<div className="mt-4 flex gap-3">
					<Button
						data-autofocus
						disabled={pending}
						variant="secondary"
						onClick={(): void => {
							setDeleting(undefined);
						}}
					>
						{t("projects.batch.cancel")}
					</Button>
					<Button
						pending={pending}
						onClick={(): void => {
							if (deleting)
								void run(
									() => onDelete(deleting.id),
									() => {
										setDeleting(undefined);
										addButton.current?.focus();
									}
								);
						}}
					>
						{t("projects.blocks.delete")}
					</Button>
				</div>
			</Dialog>
		</StructurePane>
	);
};
