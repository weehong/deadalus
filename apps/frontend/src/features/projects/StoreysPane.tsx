import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/common/api";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { ProgressionBadge } from "@/components/progress/ProgressionBadge";
import { StructurePane } from "@/features/projects/StructurePane";
import { BatchNamesForm } from "@/features/projects/BatchNamesForm";
import { nameKey } from "@/features/projects/name-generator";
import type { Block, Storey } from "@/features/projects/types";
export const StoreysPane = ({
	block,
	selectedId,
	pending = false,
	error,
	onAdd,
	onRename,
	onDelete,
	onSelect,
}: {
	block?: Block;
	selectedId?: string;
	pending?: boolean;
	error?: string;
	onAdd: (names: Array<string>) => Promise<unknown>;
	onRename: (storeyId: string, name: string) => Promise<unknown>;
	onDelete: (storeyId: string) => Promise<unknown>;
	onSelect: (storeyId: string) => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const storeys = block?.storeys ?? [];
	const [mode, setMode] = useState<"add" | "many" | undefined>();
	const [name, setName] = useState("");
	const [renaming, setRenaming] = useState<string>();
	const [rename, setRename] = useState("");
	const [deleting, setDeleting] = useState<Storey>();
	const [failure, setFailure] = useState<string>();
	const addButton = useRef<HTMLButtonElement>(null);
	const renameTrigger = useRef<HTMLButtonElement | null>(null);
	const finishRename = (): void => {
		setRenaming(undefined);
		requestAnimationFrame(() => {
			renameTrigger.current?.focus();
		});
	};
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
				? t("projects.storeys.clash", { names: names.join(", ") })
				: t("projects.storeys.error")
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
			selectedId={selectedId}
			actions={
				block && (
					<div className="flex gap-2">
						<Button
							ref={addButton}
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								setMode("add");
								setFailure(undefined);
							}}
						>
							{t("projects.storeys.add")}
						</Button>
						<Button
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								setMode("many");
								setFailure(undefined);
							}}
						>
							{t("projects.storeys.many")}
						</Button>
					</div>
				)
			}
			emptyMessage={t(
				block ? "projects.detail.emptyStoreys" : "projects.detail.selectBlock"
			)}
			heading={
				block
					? t("projects.detail.storeysOf", { name: block.name })
					: t("projects.detail.storeys")
			}
			renderActions={(id): React.ReactNode => {
				const storey = storeys.find((entry) => entry.id === id)!;
				return renaming === id ? (
					<form
						className="space-y-2 p-3"
						onSubmit={(event): void => {
							event.preventDefault();
							if (
								rename.trim() &&
								!storeys.some(
									(entry) =>
										entry.id !== id && nameKey(entry.name) === nameKey(rename)
								)
							)
								void run(
									() => onRename(id, rename.trim()),
									() => {
										finishRename();
									}
								);
						}}
					>
						<label>
							{t("projects.storeys.name")}
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
								storeys.some(
									(entry) =>
										entry.id !== id && nameKey(entry.name) === nameKey(rename)
								)
							}
						>
							{t("projects.storeys.save")}
						</Button>
						<Button
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								finishRename();
							}}
						>
							{t("projects.batch.cancel")}
						</Button>
					</form>
				) : (
					<div className="flex gap-2 px-3 pb-3">
						<Button
							ref={(element): void => {
								if (
									renaming === undefined &&
									element?.dataset["storeyId"] ===
										renameTrigger.current?.dataset["storeyId"]
								)
									renameTrigger.current = element;
							}}
							data-storey-id={id}
							disabled={pending}
							variant="secondary"
							onClick={(event): void => {
								renameTrigger.current = event.currentTarget;
								setRenaming(id);
								setRename(storey.name);
								setFailure(undefined);
							}}
						>
							{t("projects.storeys.rename")}
						</Button>
						<Button
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								setDeleting(storey);
								setFailure(undefined);
							}}
						>
							{t("projects.storeys.delete")}
						</Button>
					</div>
				);
			}}
			rows={storeys.map((storey) => ({
				id: storey.id,
				name: storey.name,
				detail: t("projects.detail.unitCount", { count: storey.units.length }),
				badge: <ProgressionBadge progression={storey.progression} />,
			}))}
			onSelect={onSelect}
		>
			{mode === "many" && (
				<BatchNamesForm
					error={failure ?? error}
					existingNames={storeys.map((storey) => storey.name)}
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
							!storeys.some((storey) => nameKey(storey.name) === nameKey(name))
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
						{t("projects.storeys.name")}
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
							storeys.some((storey) => nameKey(storey.name) === nameKey(name))
						}
					>
						{t("projects.storeys.add")}
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
				title={t("projects.storeys.deleteTitle")}
				onClose={(): void => {
					if (!pending) setDeleting(undefined);
				}}
			>
				<p>
					{t("projects.storeys.deleteConfirm", {
						name: deleting?.name,
						units: deleting?.units.length ?? 0,
						items: deleting?.itemCount ?? 0,
						entries: deleting?.entryCount ?? 0,
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
						{t("projects.storeys.delete")}
					</Button>
				</div>
			</Dialog>
		</StructurePane>
	);
};
