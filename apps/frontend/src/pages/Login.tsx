import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthenticationError, signIn, type AuthFailure } from "@/auth/auth";
import type { FunctionComponent } from "@/common/types";
import { SplitLayout } from "@/components/layout/SplitLayout";
import { BlueprintFrame } from "@/components/ui/BlueprintFrame";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { BrandPanel } from "@/features/auth/BrandPanel";
import { getBrandContent } from "@/features/auth/content";
import { LoginForm, type LoginValues } from "@/features/auth/LoginForm";

const errorKeys: Record<
	AuthFailure,
	| "auth.errors.invalidCredentials"
	| "auth.errors.rateLimited"
	| "auth.errors.unavailable"
	| "auth.errors.unknown"
> = {
	InvalidCredentials: "auth.errors.invalidCredentials",
	RateLimited: "auth.errors.rateLimited",
	Unavailable: "auth.errors.unavailable",
	Unknown: "auth.errors.unknown",
};

/** The sign-in screen; the only module on the page aware of the provider. */
export const Login = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [pending, setPending] = useState(false);
	const [failure, setFailure] = useState<AuthFailure>();

	const handleSubmit = async ({
		email,
		password,
	}: LoginValues): Promise<void> => {
		setFailure(undefined);
		setPending(true);
		try {
			await signIn(email, password);
			await navigate({ to: "/" });
		} catch (error) {
			setFailure(error instanceof AuthenticationError ? error.kind : "Unknown");
		} finally {
			setPending(false);
		}
	};

	return (
		<SplitLayout aside={<BrandPanel {...getBrandContent(t)} />}>
			<div className="grid w-full max-w-[400px] gap-4">
				<BlueprintFrame className="flex flex-col gap-4 p-7">
					<div>
						<h3 className="mb-1 text-[25px]">{t("auth.heading")}</h3>
						<p className="m-0 text-[13px] text-ink/55">{t("auth.subtitle")}</p>
					</div>
					<LoginForm
						error={failure ? t(errorKeys[failure]) : undefined}
						pending={pending}
						onSubmit={handleSubmit}
					/>
					<p className="m-0 text-xs text-ink/55">{t("auth.access")}</p>
				</BlueprintFrame>
				<LanguageSwitcher className="justify-self-end" />
			</div>
		</SplitLayout>
	);
};
