import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { loginSchema, type LoginValues } from "./loginSchema";

type ValidationKey = "emailRequired" | "emailInvalid" | "passwordRequired";

type LoginFormProps = {
	/** A mapped, user-facing failure message; rendered in an assertive alert. */
	error?: string;
	pending?: boolean;
	onSubmit: (values: LoginValues) => Promise<void> | void;
};

/** The sign-in form. Knows nothing about the provider: it receives a handler, an error and a pending flag. */
export const LoginForm = ({
	error,
	pending = false,
	onSubmit,
}: LoginFormProps): React.ReactElement => {
	const { t } = useTranslation();
	const [revealed, setRevealed] = useState(false);
	const [dismissedError, setDismissedError] = useState<string>();
	const {
		formState: { errors },
		handleSubmit,
		register,
	} = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	const validationMessage = (key: string | undefined): string | undefined =>
		key ? t(`auth.validation.${key as ValidationKey}`) : undefined;
	const toggleLabel = revealed
		? t("auth.hidePassword")
		: t("auth.showPassword");

	return (
		<form
			noValidate
			className="grid gap-4"
			onSubmit={(event) => void handleSubmit(onSubmit)(event)}
			onInput={() => {
				setDismissedError(error);
			}}
		>
			{error && error !== dismissedError && <Alert>{error}</Alert>}
			<Field
				error={validationMessage(errors.email?.message)}
				id="email"
				label={t("auth.email")}
			>
				<Input
					autoComplete="username"
					placeholder={t("auth.emailPlaceholder")}
					type="email"
					{...register("email")}
				/>
			</Field>
			<div className="relative">
				<Field
					error={validationMessage(errors.password?.message)}
					id="password"
					label={t("auth.password")}
				>
					<Input
						autoComplete="current-password"
						className="pr-10"
						placeholder={t("auth.passwordPlaceholder")}
						type={revealed ? "text" : "password"}
						{...register("password")}
					/>
				</Field>
				<button
					aria-label={toggleLabel}
					aria-pressed={revealed}
					className="absolute top-[22px] right-1 grid size-8 place-items-center text-ink/60 hover:text-ink"
					type="button"
					onClick={() => {
						setRevealed((value) => !value);
					}}
				>
					{revealed ? (
						<EyeSlashIcon aria-hidden="true" className="size-4" />
					) : (
						<EyeIcon aria-hidden="true" className="size-4" />
					)}
				</button>
			</div>
			<Button block framed pending={pending} type="submit">
				{pending ? t("auth.submitting") : t("auth.submit")}
			</Button>
		</form>
	);
};
