import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { UnitMatrixBlock } from "@/features/projects/unitMatrixTypes";
import type { MatrixError } from "@/features/projects/matrix-to-structure";

export function UnitMatrixEditor({
	value,
	onChange,
	errors = [],
	pending = false,
}: {
	value: UnitMatrixBlock;
	onChange: (value: UnitMatrixBlock) => void;
	errors?: Array<MatrixError>;
	pending?: boolean;
}): React.ReactElement {
	const { t } = useTranslation();
	const prefix = useId();
	const change = (next: UnitMatrixBlock): void => {
		onChange({
			...next,
			unitCount: next.storeys.reduce(
				(sum, row) => sum + row.cells.filter((cell) => cell?.trim()).length,
				0
			),
		});
	};
	const insertRow = (index: number): void => {
		const name = window.prompt(t("projects.upload.editor.promptStorey"));
		if (name === null) return;
		const storeys = [...value.storeys];
		storeys.splice(index, 0, { name, cells: value.stacks.map(() => null) });
		change({ ...value, storeys });
	};
	const insertColumn = (index: number): void => {
		const name = window.prompt(t("projects.upload.editor.promptStack"));
		if (name === null) return;
		if (!/^\d+$/.test(name.trim())) {
			window.alert(t("projects.upload.editor.invalidStack"));
			return;
		}
		const stacks = [...value.stacks];
		stacks.splice(index, 0, name.trim());
		change({
			...value,
			stacks,
			storeys: value.storeys.map((row) => {
				const cells = [...row.cells];
				cells.splice(index, 0, null);
				return { ...row, cells };
			}),
		});
	};
	const actions =
		"block rounded border border-rule px-2 py-1 text-xs font-normal disabled:opacity-50";
	return (
		<div
			aria-label={t("projects.upload.matrix", { name: value.name })}
			className="max-w-full overflow-x-auto"
			role="region"
			tabIndex={0}
		>
			<table
				aria-label={t("projects.upload.matrix", { name: value.name })}
				className="w-full border-collapse text-sm"
			>
				<thead>
					<tr>
						<th className="min-w-48 border border-rule p-3" scope="col">
							{t("projects.upload.storey")}
							{value.stacks.length === 0 && (
								<button
									className={actions}
									disabled={pending}
									type="button"
									onClick={(): void => {
										insertColumn(0);
									}}
								>
									{t("projects.upload.editor.addStack")}
								</button>
							)}
						</th>
						{value.stacks.map((stack, column) => (
							<th
								key={column}
								className="min-w-48 border border-rule p-3"
								scope="col"
							>
								<span>{stack}</span>
								<div className="mt-2 space-y-1">
									<button
										className={actions}
										disabled={pending}
										type="button"
										onClick={(): void => {
											insertColumn(column);
										}}
									>
										{t("projects.upload.editor.insertLeft", { stack })}
									</button>
									<button
										className={actions}
										disabled={pending}
										type="button"
										onClick={(): void => {
											insertColumn(column + 1);
										}}
									>
										{t("projects.upload.editor.insertRight", { stack })}
									</button>
									<button
										className={actions}
										disabled={pending}
										type="button"
										onClick={(): void => {
											change({
												...value,
												stacks: value.stacks.filter(
													(_, index) => index !== column
												),
												storeys: value.storeys.map((row) => ({
													...row,
													cells: row.cells.filter(
														(_, index) => index !== column
													),
												})),
											});
										}}
									>
										{t("projects.upload.editor.removeStack", { stack })}
									</button>
								</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{value.storeys.map((storey, row) => {
						const rowErrors = errors.filter(
							(error) => error.row === row && error.column === undefined
						);
						return (
							<tr key={row}>
								<th className="border border-rule p-3 text-left" scope="row">
									<input
										aria-invalid={rowErrors.length > 0}
										className="w-full min-w-24 border border-rule p-2 font-normal"
										disabled={pending}
										value={storey.name}
										aria-describedby={
											rowErrors.length ? `${prefix}-row-${row}` : undefined
										}
										aria-label={t("projects.upload.editor.storeyName", {
											row: row + 1,
										})}
										onChange={(event): void => {
											change({
												...value,
												storeys: value.storeys.map((entry, index) =>
													index === row
														? { ...entry, name: event.target.value }
														: entry
												),
											});
										}}
									/>
									<div id={`${prefix}-row-${row}`}>
										{rowErrors.map((error, index) => (
											<p key={index} role="alert">
												{t(`projects.upload.editor.errors.${error.code}`)}
											</p>
										))}
									</div>
									<div className="mt-2 space-y-1">
										<button
											className={actions}
											disabled={pending}
											type="button"
											onClick={(): void => {
												insertRow(row);
											}}
										>
											{t("projects.upload.editor.insertAbove", {
												storey: storey.name,
											})}
										</button>
										<button
											className={actions}
											disabled={pending}
											type="button"
											onClick={(): void => {
												insertRow(row + 1);
											}}
										>
											{t("projects.upload.editor.insertBelow", {
												storey: storey.name,
											})}
										</button>
										<button
											className={actions}
											disabled={pending}
											type="button"
											onClick={(): void => {
												change({
													...value,
													storeys: value.storeys.filter(
														(_, index) => index !== row
													),
												});
											}}
										>
											{t("projects.upload.editor.removeStorey", {
												storey: storey.name,
											})}
										</button>
									</div>
								</th>
								{value.stacks.map((stack, column) => {
									const cellErrors = errors.filter(
										(error) => error.row === row && error.column === column
									);
									return (
										<td
											key={column}
											className="border border-rule p-3 align-top"
										>
											<input
												aria-invalid={cellErrors.length > 0}
												className="w-full min-w-32 border border-rule p-2"
												disabled={pending}
												value={storey.cells[column] ?? ""}
												aria-describedby={
													cellErrors.length
														? `${prefix}-cell-${row}-${column}`
														: undefined
												}
												aria-label={t("projects.upload.editor.cell", {
													storey: storey.name,
													stack,
												})}
												onChange={(event): void => {
													change({
														...value,
														storeys: value.storeys.map((entry, index) =>
															index === row
																? {
																		...entry,
																		cells: entry.cells.map((cell, cellIndex) =>
																			cellIndex === column
																				? event.target.value || null
																				: cell
																		),
																	}
																: entry
														),
													});
												}}
											/>
											<div id={`${prefix}-cell-${row}-${column}`}>
												{cellErrors.map((error, index) => (
													<p key={index} role="alert">
														{t(`projects.upload.editor.errors.${error.code}`)}
													</p>
												))}
											</div>
										</td>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
			{value.storeys.length === 0 && (
				<button
					className={actions}
					disabled={pending}
					type="button"
					onClick={(): void => {
						insertRow(0);
					}}
				>
					{t("projects.upload.editor.addStorey")}
				</button>
			)}
		</div>
	);
}
