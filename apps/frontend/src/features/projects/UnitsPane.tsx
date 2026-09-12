import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/common/api";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import { UnitCard } from "@/features/projects/UnitCard";
import {
	UnitBatchForm,
	type UnitBatchInput,
} from "@/features/projects/UnitBatchForm";
import { nameKey } from "@/features/projects/name-generator";
import type { Block, Storey, Unit, UnitType } from "@/features/projects/types";
import type { UnitEditInput } from "@/features/projects/units-api";
export const UnitsPane = ({
	block,
	storey,
	unitTypes,
	pending = false,
	onAdd,
	onEdit,
	onDelete,
}: {
	block?: Block;
	storey?: Storey;
	unitTypes: Array<UnitType>;
	pending?: boolean;
	onAdd: (body: UnitBatchInput) => Promise<unknown>;
	onEdit: (id: string, body: UnitEditInput) => Promise<unknown>;
	onDelete: (id: string) => Promise<unknown>;
}): React.ReactElement => {
	const { t } = useTranslation();
	const [mode, setMode] = useState<"add" | "many">();
	const [editing, setEditing] = useState<string>();
	const [name, setName] = useState("");
	const [type, setType] = useState("");
	const [deleting, setDeleting] = useState<Unit>();
	const [failure, setFailure] = useState<string>();
	const addButton = useRef<HTMLButtonElement>(null);
	const editButtons = useRef(new Map<string, HTMLButtonElement>());
	const closeEdit = (): void => {
		const id = editing;
		setEditing(undefined);
		requestAnimationFrame(() => {
			if (id) editButtons.current.get(id)?.focus();
		});
	};
	const cancel = (): void => {
		setMode(undefined);
		setFailure(undefined);
		addButton.current?.focus();
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
			const details =
				error instanceof ApiRequestError ? error.details : undefined;
			const names =
				details &&
				typeof details === "object" &&
				"names" in details &&
				Array.isArray(details.names)
					? details.names.filter(
							(value): value is string => typeof value === "string"
						)
					: [];
			setFailure(
				names.length
					? t("projects.units.clash", { names: names.join(", ") })
					: t("projects.units.error")
			);
		}
	};
	const invalid =
		!name.trim() ||
		(storey?.units.some(
			(unit) => unit.id !== editing && nameKey(unit.name) === nameKey(name)
		) ??
			false);
	const fields = (
		<>
			<label className="block">
				{t("projects.units.name")}
				<input
					autoFocus
					required
					className="block w-full border border-rule p-2"
					disabled={pending}
					maxLength={60}
					value={name}
					onChange={(event) => {
						setName(event.target.value);
					}}
				/>
			</label>
			<label className="block">
				{t("projects.units.type")}
				<select
					className="block w-full border border-rule p-2"
					disabled={pending}
					value={type}
					onChange={(event) => {
						setType(event.target.value);
					}}
				>
					<option value="">{t("projects.detail.noType")}</option>
					{unitTypes.map((unitType) => (
						<option key={unitType.id} value={unitType.id}>
							{unitType.code}
						</option>
					))}
				</select>
			</label>
		</>
	);
	return (
		<section
			aria-labelledby="project-units-heading"
			className="min-w-0 border border-rule"
		>
			<header className="space-y-3 border-b border-rule p-4">
				<h2 className="m-0 break-words text-xl" id="project-units-heading">
					{storey
						? t("projects.detail.unitsOf", {
								block: block?.name,
								name: storey.name,
							})
						: t("projects.detail.units")}
				</h2>
				{storey && (
					<div className="flex gap-2">
						<Button
							ref={addButton}
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								setMode("add");
								setEditing(undefined);
								setName("");
								setType("");
								setFailure(undefined);
							}}
						>
							{t("projects.units.add")}
						</Button>
						<Button
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								setMode("many");
								setEditing(undefined);
								setFailure(undefined);
							}}
						>
							{t("projects.units.many")}
						</Button>
					</div>
				)}
			</header>
			{mode === "many" && block && storey && (
				<UnitBatchForm
					error={failure}
					pending={pending}
					selectedStoreyId={storey.id}
					storeys={block.storeys}
					unitTypes={unitTypes}
					onCancel={cancel}
					onSubmit={(body) => {
						void run(() => onAdd(body), cancel);
					}}
				/>
			)}
			{mode === "add" && storey && (
				<form
					className="space-y-3 p-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (!invalid && !pending)
							void run(
								() =>
									onAdd({
										names: [name.trim()],
										storeyIds: [storey.id],
										...(type ? { unitTypeId: type } : {}),
									}),
								() => {
									setName("");
								}
							);
					}}
				>
					{fields}
					<Button disabled={invalid} pending={pending} type="submit">
						{t("projects.units.add")}
					</Button>
					<Button disabled={pending} variant="secondary" onClick={cancel}>
						{t("projects.batch.cancel")}
					</Button>
				</form>
			)}
			<ul aria-labelledby="project-units-heading" className="m-0 list-none p-0">
				{storey?.units.map((unit) => (
					<li key={unit.id}>
						{editing === unit.id ? (
							<form
								className="space-y-3 border-b border-rule p-4"
								onSubmit={(event) => {
									event.preventDefault();
									if (!invalid && !pending)
										void run(
											() =>
												onEdit(unit.id, {
													name: name.trim(),
													unitTypeId: type || null,
												}),
											closeEdit
										);
								}}
							>
								{fields}
								<Button disabled={invalid} pending={pending} type="submit">
									{t("projects.units.save")}
								</Button>
								<Button
									disabled={pending}
									variant="secondary"
									onClick={closeEdit}
								>
									{t("projects.batch.cancel")}
								</Button>
							</form>
						) : (
							<UnitCard
								name={unit.name}
								actions={
									<div className="flex gap-2">
										<Button
											ref={(element) => {
												if (element) editButtons.current.set(unit.id, element);
												else editButtons.current.delete(unit.id);
											}}
											disabled={pending}
											variant="secondary"
											onClick={(): void => {
												setMode(undefined);
												setEditing(unit.id);
												setName(unit.name);
												setType(unit.unitTypeId ?? "");
												setFailure(undefined);
											}}
										>
											{t("projects.units.edit")}
										</Button>
										<Button
											disabled={pending}
											variant="secondary"
											onClick={(): void => {
												setDeleting(unit);
												setFailure(undefined);
											}}
										>
											{t("projects.units.delete")}
										</Button>
									</div>
								}
								typeCode={
									unitTypes.find((type) => type.id === unit.unitTypeId)?.code
								}
							/>
						)}
					</li>
				))}
			</ul>
			{!storey?.units.length && (
				<p className="p-4 text-sm">
					{t(
						storey
							? "projects.detail.emptyUnits"
							: "projects.detail.selectStorey"
					)}
				</p>
			)}
			{mode !== "many" && !deleting && failure && <Alert>{failure}</Alert>}
			<Dialog
				open={Boolean(deleting)}
				title={t("projects.units.deleteTitle")}
				onClose={(): void => {
					if (!pending) setDeleting(undefined);
				}}
			>
				<p>{t("projects.units.deleteConfirm", { name: deleting?.name })}</p>
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
										requestAnimationFrame(() => {
											addButton.current?.focus();
										});
									}
								);
						}}
					>
						{t("projects.units.delete")}
					</Button>
				</div>
			</Dialog>
		</section>
	);
};
