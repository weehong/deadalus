import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
	generateNames,
	previewNames,
} from "@/features/projects/name-generator";
export interface BatchNamesFormProps {
	existingNames: Array<string>;
	pending?: boolean;
	multiplier?: number;
	maxTotal?: number;
	selectionValid?: boolean;
	error?: string;
	children?: ReactNode;
	onSubmit: (names: Array<string>) => void;
	onCancel: () => void;
}
export const BatchNamesForm = ({
	existingNames,
	pending = false,
	multiplier = 1,
	maxTotal,
	selectionValid = true,
	error,
	children,
	onSubmit,
	onCancel,
}: BatchNamesFormProps): React.ReactElement => {
	const { t } = useTranslation();
	const [mode, setMode] = useState<"range" | "list">("range");
	const [prefix, setPrefix] = useState("");
	const [suffix, setSuffix] = useState("");
	const [from, setFrom] = useState("1");
	const [to, setTo] = useState("1");
	const [pad, setPad] = useState("0");
	const [text, setText] = useState("");
	const names = generateNames(
		mode === "list"
			? { mode, text }
			: {
					mode,
					prefix,
					suffix,
					from: from === "" ? NaN : Number(from),
					to: to === "" ? NaN : Number(to),
					pad: pad === "" ? NaN : Number(pad),
				}
	);
	const preview = previewNames(names, existingNames);
	const invalid =
		!selectionValid ||
		(maxTotal !== undefined && names.length * multiplier > maxTotal) ||
		!names.length ||
		names.length > 500 ||
		preview.some(
			(entry) =>
				entry.existing ||
				entry.repeated ||
				!entry.name ||
				entry.name.length > 60
		);
	return (
		<form
			aria-label={t("projects.batch.title")}
			className="space-y-3 p-4"
			onSubmit={(event): void => {
				event.preventDefault();
				if (!invalid && !pending) onSubmit(names);
			}}
		>
			<fieldset disabled={pending}>
				<legend>{t("projects.batch.mode")}</legend>
				{(["range", "list"] as const).map((value) => (
					<label key={value} className="mr-4">
						<input
							checked={mode === value}
							name="batch-mode"
							type="radio"
							value={value}
							onChange={(): void => {
								setMode(value);
							}}
						/>
						{t(`projects.batch.${value}`)}
					</label>
				))}
			</fieldset>
			{mode === "range" ? (
				<div className="grid grid-cols-2 gap-3">
					{(
						[
							{ key: "prefix", value: prefix, set: setPrefix },
							{ key: "from", value: from, set: setFrom },
							{ key: "to", value: to, set: setTo },
							{ key: "pad", value: pad, set: setPad },
							{ key: "suffix", value: suffix, set: setSuffix },
						] as const
					).map((field) => (
						<label key={field.key} className="min-w-0 text-sm">
							{t(`projects.batch.${field.key}`)}
							<input
								className="block w-full border border-rule p-2"
								disabled={pending}
								maxLength={60}
								value={field.value}
								type={
									field.key === "prefix" || field.key === "suffix"
										? "text"
										: "number"
								}
								onChange={(event): void => {
									field.set(event.target.value);
								}}
							/>
						</label>
					))}
				</div>
			) : (
				<label className="block text-sm">
					{t("projects.batch.names")}
					<textarea
						className="block w-full border border-rule p-2"
						disabled={pending}
						rows={5}
						value={text}
						onChange={(event): void => {
							setText(event.target.value);
						}}
					/>
				</label>
			)}
			{children}
			<p aria-live="polite">
				{t("projects.batch.count", { count: names.length })}
				{maxTotal !== undefined && (
					<span>
						{" "}
						·{" "}
						{t("projects.units.total", {
							count: names.length * multiplier,
							storeys: multiplier,
						})}
					</span>
				)}
			</p>
			<ul
				aria-label={t("projects.batch.preview")}
				className="max-h-64 overflow-auto"
			>
				{preview.map((entry, index) => (
					<li key={`${index.toString()}-${entry.name}`}>
						{entry.name}{" "}
						{entry.existing && (
							<strong className="text-red-700">
								{t("projects.batch.existing")}
							</strong>
						)}{" "}
						{entry.repeated && (
							<strong className="text-red-700">
								{t("projects.batch.repeated")}
							</strong>
						)}
					</li>
				))}
			</ul>
			{invalid &&
				!preview.some((entry) => entry.existing || entry.repeated) && (
					<p>{t("projects.batch.invalid")}</p>
				)}
			{error && <Alert>{error}</Alert>}
			<div className="flex gap-3">
				<Button disabled={invalid} pending={pending} type="submit">
					{t(pending ? "projects.batch.pending" : "projects.batch.submit")}
				</Button>
				<Button disabled={pending} variant="secondary" onClick={onCancel}>
					{t("projects.batch.cancel")}
				</Button>
			</div>
		</form>
	);
};
