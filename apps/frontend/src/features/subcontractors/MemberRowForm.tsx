import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import {
	memberFieldsSchema,
	type MemberValues,
	type MemberFailure,
} from "./formSchemas";
interface MemberRowFormProps {
	member?: MemberValues;
	pending?: boolean;
	onCancel: () => void;
	onSubmit: (values: MemberValues) => Promise<MemberFailure | void>;
}
export const MemberRowForm = ({
	member,
	pending = false,
	onCancel,
	onSubmit,
}: MemberRowFormProps): React.ReactElement => {
	const { t } = useTranslation();
	const id = useId();
	const [failure, setFailure] = useState<string>();
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<MemberValues>({
		resolver: zodResolver(memberFieldsSchema),
		defaultValues: member ?? { name: "", phone: "" },
	});
	const busy = pending || isSubmitting;
	const message = (
		error: { type: string; message?: string } | undefined
	): string | undefined =>
		error?.message
			? error.type === "server"
				? error.message
				: t(
						`subcontractors.form.validation.${error.message as "memberNameRequired" | "phoneRequired" | "phoneInvalid"}`
					)
			: undefined;
	const submit = async (values: MemberValues): Promise<void> => {
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
			className="grid gap-3 sm:grid-cols-2"
			aria-label={t(
				member ? "subcontractors.member.edit" : "subcontractors.member.add"
			)}
			onSubmit={(event) => void handleSubmit(submit)(event)}
		>
			{failure && (
				<div className="sm:col-span-2">
					<Alert>{failure}</Alert>
				</div>
			)}
			<Field
				error={message(errors.name)}
				id={`${id}-name`}
				label={t("subcontractors.form.memberName")}
			>
				<Input
					required
					autoComplete="off"
					readOnly={busy}
					{...register("name")}
				/>
			</Field>
			<Field
				error={message(errors.phone)}
				id={`${id}-phone`}
				label={t("subcontractors.form.phone")}
			>
				<Input
					required
					autoComplete="tel"
					readOnly={busy}
					type="tel"
					{...register("phone")}
				/>
			</Field>
			<div className="flex flex-wrap gap-2 sm:col-span-2">
				<Button pending={busy} type="submit">
					{t(
						busy
							? "subcontractors.member.saving"
							: member
								? "subcontractors.member.save"
								: "subcontractors.member.add"
					)}
				</Button>
				<Button disabled={busy} variant="secondary" onClick={onCancel}>
					{t("subcontractors.form.cancel")}
				</Button>
			</div>
		</form>
	);
};
