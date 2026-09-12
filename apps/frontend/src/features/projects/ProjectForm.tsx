import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import {
	projectFormSchema,
	type ProjectFailure,
	type ProjectValues,
} from "@/features/projects/formSchemas";

type ValidationKey =
	"nameRequired" | "nameTooLong" | "codeRequired" | "codeInvalid";
interface ProjectFormProps {
	pending?: boolean;
	initialValues?: ProjectValues;
	mode?: "create" | "edit";
	onCancel: () => void;
	onSubmit: (values: ProjectValues) => Promise<ProjectFailure | void>;
}

export const ProjectForm = ({
	pending = false,
	initialValues = { name: "", code: "" },
	mode = "create",
	onCancel,
	onSubmit,
}: ProjectFormProps): React.ReactElement => {
	const { t } = useTranslation();
	const [failure, setFailure] = useState<string>();
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<ProjectValues>({
		resolver: zodResolver(projectFormSchema),
		defaultValues: initialValues,
	});
	const errorMessage = (
		error: { type: string; message?: string } | undefined
	): string | undefined =>
		error?.message
			? error.type === "server"
				? error.message
				: t(`projects.form.validation.${error.message as ValidationKey}`)
			: undefined;
	const busy = pending || isSubmitting;
	const submit = async (values: ProjectValues): Promise<void> => {
		if (busy) return;
		setFailure(undefined);
		const result = await onSubmit(values);
		if (result?.field)
			setError(
				result.field,
				{ type: "server", message: result.message },
				{ shouldFocus: true }
			);
		else if (result) setFailure(result.message);
	};
	return (
		<form
			noValidate
			className="grid max-w-xl gap-4"
			onSubmit={(event) => void handleSubmit(submit)(event)}
		>
			{failure && <Alert>{failure}</Alert>}
			<Field
				error={errorMessage(errors.name)}
				id="project-name"
				label={t("projects.form.name")}
			>
				<Input required autoComplete="off" {...register("name")} />
			</Field>
			<Field
				error={errorMessage(errors.code)}
				id="project-code"
				label={t("projects.form.code")}
			>
				<Input
					required
					autoComplete="off"
					{...register("code", {
						onChange: (event: React.ChangeEvent<HTMLInputElement>): void => {
							event.target.value = event.target.value.toUpperCase();
						},
					})}
				/>
			</Field>
			<div className="flex flex-wrap gap-3">
				<Button pending={busy} type="submit">
					{busy
						? t(`projects.${mode}.submitting`)
						: t(`projects.${mode}.submit`)}
				</Button>
				<Button disabled={busy} variant="secondary" onClick={onCancel}>
					{t("projects.form.cancel")}
				</Button>
			</div>
		</form>
	);
};
