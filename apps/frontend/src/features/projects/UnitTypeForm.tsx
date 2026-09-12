import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { UnitTypeInput } from "@/features/projects/unitTypesApi";
import type { UnitType } from "@/features/projects/types";

const schema = z.object({
	code: z.string().trim().min(1, "codeRequired").max(40, "codeTooLong"),
	description: z.string().trim().max(120, "descriptionTooLong"),
});
export interface UnitTypeFailure {
	field?: "code" | "description";
	message: string;
}
export const UnitTypeForm = ({
	unitType,
	pending = false,
	onSubmit,
	onCancel,
}: {
	unitType?: UnitType;
	pending?: boolean;
	onSubmit: (values: UnitTypeInput) => Promise<UnitTypeFailure | void>;
	onCancel?: () => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const id = useId();
	const [failure, setFailure] = useState<string>();
	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			code: unitType?.code ?? "",
			description: unitType?.description ?? "",
		},
	});
	const busy = pending || isSubmitting;
	const submit = async (values: z.infer<typeof schema>): Promise<void> => {
		if (busy) return;
		setFailure(undefined);
		const result = await onSubmit({
			code: values.code,
			description: values.description || null,
		});
		if (result?.field)
			setError(
				result.field,
				{ type: "server", message: result.message },
				{ shouldFocus: true }
			);
		else if (result) setFailure(result.message);
		else if (!unitType) reset();
	};
	return (
		<form
			noValidate
			className="grid gap-3 p-3 sm:grid-cols-[1fr_2fr_auto]"
			aria-label={t(
				unitType ? "projects.unitTypes.edit" : "projects.unitTypes.add"
			)}
			onSubmit={(event) => void handleSubmit(submit)(event)}
		>
			{failure && (
				<div className="sm:col-span-3">
					<Alert>{failure}</Alert>
				</div>
			)}
			<Field
				id={`${id}-code`}
				label={t("projects.columns.code")}
				error={
					errors.code
						? errors.code.type === "server"
							? errors.code.message
							: t(
									errors.code.message === "codeTooLong"
										? "projects.unitTypes.codeTooLong"
										: "projects.unitTypes.codeRequired"
								)
						: undefined
				}
			>
				<Input
					required
					autoComplete="off"
					disabled={busy}
					{...register("code")}
				/>
			</Field>
			<Field
				id={`${id}-description`}
				label={t("projects.detail.description")}
				error={
					errors.description
						? errors.description.type === "server"
							? errors.description.message
							: t("projects.unitTypes.descriptionTooLong")
						: undefined
				}
			>
				<Input
					autoComplete="off"
					disabled={busy}
					{...register("description")}
				/>
			</Field>
			<div className="flex flex-wrap items-center gap-2">
				<Button pending={busy} type="submit">
					{t(
						busy
							? "projects.unitTypes.saving"
							: unitType
								? "projects.unitTypes.save"
								: "projects.unitTypes.add"
					)}
				</Button>
				{onCancel && (
					<Button disabled={busy} variant="secondary" onClick={onCancel}>
						{t("projects.unitTypes.cancel")}
					</Button>
				)}
			</div>
		</form>
	);
};
