import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import {
	renameSubcontractorSchema,
	type RenameSubcontractorFailure,
	type RenameSubcontractorValues,
} from "./formSchemas";

interface RenameSubcontractorFormProps {
	name: string;
	pending?: boolean;
	onCancel: () => void;
	onSubmit: (
		values: RenameSubcontractorValues
	) => Promise<RenameSubcontractorFailure | void>;
}
export const RenameSubcontractorForm = ({
	name,
	pending = false,
	onCancel,
	onSubmit,
}: RenameSubcontractorFormProps): React.ReactElement => {
	const [failure, setFailure] = useState<string>();
	const { t } = useTranslation();
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<RenameSubcontractorValues>({
		resolver: zodResolver(renameSubcontractorSchema),
		defaultValues: { name },
	});
	const busy = pending || isSubmitting;
	const submit = async (values: RenameSubcontractorValues): Promise<void> => {
		if (busy) return;
		setFailure(undefined);
		const result = await onSubmit(values);
		if (result?.field)
			setError(
				"name",
				{ type: "server", message: result.message },
				{ shouldFocus: true }
			);
		else if (result) setFailure(result.message);
	};
	return (
		<form
			noValidate
			className="grid max-w-xl flex-1 gap-3"
			onSubmit={(event) => void handleSubmit(submit)(event)}
		>
			{failure && <Alert>{failure}</Alert>}
			<Field
				id="rename-subcontractor-name"
				label={t("subcontractors.form.name")}
				error={
					errors.name
						? errors.name.type === "server"
							? errors.name.message
							: t("subcontractors.form.validation.nameRequired")
						: undefined
				}
			>
				<Input required autoComplete="off" {...register("name")} />
			</Field>
			<div className="flex flex-wrap gap-3">
				<Button pending={busy} type="submit">
					{t(
						busy
							? "subcontractors.rename.submitting"
							: "subcontractors.rename.submit"
					)}
				</Button>
				<Button disabled={busy} variant="secondary" onClick={onCancel}>
					{t("subcontractors.form.cancel")}
				</Button>
			</div>
		</form>
	);
};
