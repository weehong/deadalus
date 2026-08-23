import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export type SignInValues = { email: string; password: string };
type SignInFormProps = {
	error?: string;
	pending?: boolean;
	onSubmit: (values: SignInValues) => Promise<void> | void;
};

export const SignInForm = ({
	error,
	pending = false,
	onSubmit,
}: SignInFormProps) => {
	const { t } = useTranslation();
	const [revealed, setRevealed] = useState(false);
	const [dismissedError, setDismissedError] = useState<string>();
	const passwordToggleLabel = revealed
		? t("auth.hidePassword")
		: t("auth.showPassword");
	const {
		formState: { errors },
		handleSubmit,
		register,
	} = useForm<SignInValues>();
	return (
		<form
			noValidate
			className="grid gap-5"
			onSubmit={(event) => void handleSubmit(onSubmit)(event)}
			onInput={() => {
				setDismissedError(error);
			}}
		>
			{error && error !== dismissedError && <Alert>{error}</Alert>}
			<Field error={errors.email?.message} id="email" label={t("auth.email")}>
				<Input
					autoComplete="username"
					placeholder={t("auth.emailPlaceholder")}
					type="email"
					{...register("email", {
						required: t("auth.validation.emailRequired"),
						pattern: {
							value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
							message: t("auth.validation.emailInvalid"),
						},
					})}
				/>
			</Field>
			<div className="relative">
				<Field
					error={errors.password?.message}
					id="password"
					label={t("auth.password")}
				>
					<Input
						autoComplete="current-password"
						className="pr-12"
						placeholder={t("auth.passwordPlaceholder")}
						type={revealed ? "text" : "password"}
						{...register("password", {
							required: t("auth.validation.passwordRequired"),
						})}
					/>
				</Field>
				<button
					aria-label={passwordToggleLabel}
					aria-pressed={revealed}
					className="absolute right-2 top-8 flex h-9 w-9 items-center justify-center text-steel-700 hover:text-ink focus-visible:outline-2 focus-visible:outline-signal-500"
					type="button"
					onClick={() => {
						setRevealed((value) => !value);
					}}
				>
					{revealed ? (
						<EyeSlashIcon aria-hidden="true" className="h-5 w-5" />
					) : (
						<EyeIcon aria-hidden="true" className="h-5 w-5" />
					)}
				</button>
			</div>
			<Button block framed pending={pending} type="submit">
				{pending ? t("auth.submitting") : t("auth.submit")}
			</Button>
		</form>
	);
};
