import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BatchNamesForm } from "@/features/projects/BatchNamesForm";
import type { Storey, UnitType } from "@/features/projects/types";
export interface UnitBatchInput {
	storeyIds: Array<string>;
	names: Array<string>;
	unitTypeId?: string;
}
export const UnitBatchForm = ({
	storeys,
	selectedStoreyId,
	unitTypes,
	pending = false,
	error,
	onSubmit,
	onCancel,
}: {
	storeys: Array<Storey>;
	selectedStoreyId: string;
	unitTypes: Array<UnitType>;
	pending?: boolean;
	error?: string;
	onSubmit: (body: UnitBatchInput) => void;
	onCancel: () => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const [selected, setSelected] = useState<Array<string>>([selectedStoreyId]);
	const [type, setType] = useState("");
	return (
		<BatchNamesForm
			error={error}
			maxTotal={2000}
			multiplier={selected.length}
			pending={pending}
			selectionValid={selected.length > 0 && selected.length <= 200}
			existingNames={storeys
				.filter((s) => selected.includes(s.id))
				.flatMap((s) => s.units.map((u) => u.name))}
			onCancel={onCancel}
			onSubmit={(names) => {
				onSubmit({
					names,
					storeyIds: selected,
					...(type ? { unitTypeId: type } : {}),
				});
			}}
		>
			<fieldset disabled={pending}>
				<legend>{t("projects.units.storeys")}</legend>
				<label className="block">
					<input
						checked={selected.length === storeys.length}
						type="checkbox"
						onChange={(event) => {
							setSelected(event.target.checked ? storeys.map((s) => s.id) : []);
						}}
					/>
					{t("projects.units.selectAll")}
				</label>
				{storeys.map((storey) => (
					<label key={storey.id} className="mr-3 inline-block">
						<input
							checked={selected.includes(storey.id)}
							type="checkbox"
							onChange={(event) => {
								setSelected(
									event.target.checked
										? [...selected, storey.id]
										: selected.filter((id) => id !== storey.id)
								);
							}}
						/>
						{storey.name}
					</label>
				))}
			</fieldset>
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
					{unitTypes.map((type) => (
						<option key={type.id} value={type.id}>
							{type.code}
						</option>
					))}
				</select>
			</label>
			{(!selected.length || selected.length > 200) && (
				<p>{t("projects.units.storeyLimit")}</p>
			)}
		</BatchNamesForm>
	);
};
