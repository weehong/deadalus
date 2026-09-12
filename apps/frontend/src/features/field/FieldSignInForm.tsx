import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import {
	fieldSignInSchema,
	type FieldSignInValues,
} from "@/features/field/fieldSignInSchema";

type FieldSignInFormProps = {
	/** A mapped, user-facing failure message; rendered in an assertive alert. */
	error?: string;
	pending?: boolean;
	onSubmit: (values: FieldSignInValues) => Promise<void> | void;
};

/**
 * The Field's sign-in form: one phone control and one button, both at least
 * 44px tall for a thumb. Knows nothing about the API: it receives a handler,
 * an error and a pending flag.
 */
export const FieldSignInForm = ({
	error,
	pending = false,
	onSubmit,
}: FieldSignInFormProps): React.ReactElement => {
	const { t } = useTranslation();
	const [dismissedError, setDismissedError] = useState<string>();
	const {
		formState: { errors },
		handleSubmit,
		register,
	} = useForm<FieldSignInValues>({
		resolver: zodResolver(fieldSignInSchema),
		defaultValues: { phone: "" },
	});
	const phoneError =
		errors.phone?.message === "phoneRequired"
			? t("field.signIn.validation.phoneRequired")
			: errors.phone?.message;

	return (
		<form
			noValidate
			aria-label={t("field.signIn.heading")}
			className="grid gap-4"
			onInput={() => {
				setDismissedError(error);
			}}
			onSubmit={(event) =>
				void handleSubmit((values) => onSubmit(values))(event)
			}
		>
			{error && error !== dismissedError && <Alert>{error}</Alert>}
			<Field error={phoneError} id="phone" label={t("field.signIn.phone")}>
				<Input
					autoComplete="tel"
					className="h-[44px] text-base"
					inputMode="tel"
					placeholder={t("field.signIn.phonePlaceholder")}
					type="tel"
					{...register("phone")}
				/>
			</Field>
			<Button block framed className="h-[44px]" pending={pending} type="submit">
				{pending ? t("field.signIn.submitting") : t("field.signIn.submit")}
			</Button>
		</form>
	);
};
