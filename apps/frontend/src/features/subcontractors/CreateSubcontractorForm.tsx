import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import {
	createSubcontractorSchema,
	type CreateSubcontractorFailure,
	type CreateSubcontractorValues,
} from "./formSchemas";

type ValidationKey =
	"nameRequired" | "memberNameRequired" | "phoneRequired" | "phoneInvalid";
interface CreateSubcontractorFormProps {
	pending?: boolean;
	onCancel: () => void;
	onSubmit: (
		values: CreateSubcontractorValues
	) => Promise<CreateSubcontractorFailure | void>;
}

export const CreateSubcontractorForm = ({
	pending = false,
	onCancel,
	onSubmit,
}: CreateSubcontractorFormProps): React.ReactElement => {
	const { t } = useTranslation();
	const [failure, setFailure] = useState<string>();
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<CreateSubcontractorValues>({
		resolver: zodResolver(createSubcontractorSchema),
		defaultValues: { name: "", member: { name: "", phone: "" } },
	});
	const errorMessage = (
		error: { type: string; message?: string } | undefined
	): string | undefined =>
		error?.message
			? error.type === "server"
				? error.message
				: t(`subcontractors.form.validation.${error.message as ValidationKey}`)
			: undefined;
	const busy = pending || isSubmitting;
	const submit = async (values: CreateSubcontractorValues): Promise<void> => {
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
				id="subcontractor-name"
				label={t("subcontractors.form.name")}
			>
				<Input required autoComplete="off" {...register("name")} />
			</Field>
			<fieldset className="grid gap-4 border border-rule p-4">
				<legend className="px-1 font-heading text-sm font-semibold">
					{t("subcontractors.create.firstMember")}
				</legend>
				<Field
					error={errorMessage(errors.member?.name)}
					id="member-name"
					label={t("subcontractors.form.memberName")}
				>
					<Input required autoComplete="off" {...register("member.name")} />
				</Field>
				<Field
					error={errorMessage(errors.member?.phone)}
					id="member-phone"
					label={t("subcontractors.form.phone")}
				>
					<Input
						required
						autoComplete="tel"
						type="tel"
						{...register("member.phone")}
					/>
				</Field>
			</fieldset>
			<div className="flex flex-wrap gap-3">
				<Button pending={busy} type="submit">
					{busy
						? t("subcontractors.create.submitting")
						: t("subcontractors.create.submit")}
				</Button>
				<Button disabled={busy} variant="secondary" onClick={onCancel}>
					{t("subcontractors.form.cancel")}
				</Button>
			</div>
		</form>
	);
};
