import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { ProgressEntryInput } from "@/common/items";
import type { ProgressEntryFailure } from "@/common/progress-entry-failure";

// The API's rule, checked before a request: a whole number from 0 to 100 and
// a note of at most 200 characters once trimmed (a blank note does not travel).
const schema = z.object({
	value: z
		.number({ error: "valueInvalid" })
		.int("valueInvalid")
		.min(0, "valueInvalid")
		.max(100, "valueInvalid"),
	note: z.string().trim().max(200, "noteTooLong"),
});
type Values = z.infer<typeof schema>;
export interface ProgressEntryFormProps {
	itemName: string;
	/** The Item has no Assignment: the controls are disabled and the hint shown. */
	unassigned?: boolean;
	pending?: boolean;
	/** Extra classes on each control; the Field sizes them for a thumb. */
	controlClassName?: string;
	onSubmit: (input: ProgressEntryInput) => Promise<ProgressEntryFailure | void>;
}
/**
 * The inline "Enter progress" form on an Item of the Unit card, and, with
 * thumb-sized controls, on the Field's Unit screen. Disabled with a hint
 * while the Item has no Assignment, since it accepts no entry.
 */
export const ProgressEntryForm = ({
	itemName,
	unassigned = false,
	pending = false,
	controlClassName = "",
	onSubmit,
}: ProgressEntryFormProps): React.ReactElement => {
	const { t } = useTranslation();
	const id = useId();
	const [failure, setFailure] = useState<string>();
	const focusField = useRef<"value" | "note">(undefined);
	const {
		register,
		handleSubmit,
		setError,
		setFocus,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { note: "" },
	});
	const busy = pending || isSubmitting;
	const locked = busy || unassigned;
	// A field the API refused is focused once the controls are enabled again;
	// while the submission is in flight they are disabled and cannot take focus.
	useEffect(() => {
		if (focusField.current && !busy) {
			setFocus(focusField.current);
			focusField.current = undefined;
		}
	}, [busy, setFocus]);
	const submit = async (values: Values): Promise<void> => {
		if (busy) return;
		setFailure(undefined);
		const result = await onSubmit({
			value: values.value,
			...(values.note ? { note: values.note } : {}),
		});
		if (result?.field) {
			setError(result.field, { type: "server", message: result.message });
			focusField.current = result.field;
		} else if (result) setFailure(result.message);
		else reset();
	};
	return (
		<form
			noValidate
			aria-label={t("projects.progress.enterFor", { name: itemName })}
			className="grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-end"
			onSubmit={(event) => void handleSubmit(submit)(event)}
		>
			{failure && (
				<div className="sm:col-span-3">
					<Alert>{failure}</Alert>
				</div>
			)}
			{unassigned && (
				<p className="m-0 text-sm sm:col-span-3">
					{t("projects.progress.unassignedHint")}
				</p>
			)}
			<Field
				id={`${id}-value`}
				label={t("projects.progress.value")}
				error={
					errors.value
						? errors.value.type === "server"
							? errors.value.message
							: t("projects.progress.valueInvalid")
						: undefined
				}
			>
				<Input
					className={controlClassName}
					disabled={locked}
					inputMode="numeric"
					max={100}
					min={0}
					step={1}
					type="number"
					{...register("value", { valueAsNumber: true })}
				/>
			</Field>
			<Field
				id={`${id}-note`}
				label={t("projects.progress.note")}
				error={
					errors.note
						? errors.note.type === "server"
							? errors.note.message
							: t("projects.progress.noteTooLong")
						: undefined
				}
			>
				<Input
					autoComplete="off"
					className={controlClassName}
					disabled={locked}
					{...register("note")}
				/>
			</Field>
			<Button
				className={controlClassName}
				disabled={unassigned}
				pending={busy}
				type="submit"
			>
				{t(busy ? "projects.progress.submitting" : "projects.progress.submit")}
			</Button>
		</form>
	);
};
