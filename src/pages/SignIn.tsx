import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthenticationError, signIn, type AuthFailure } from "@/auth/auth";
import type { FunctionComponent } from "@/common/types";
import { BlueprintFrame } from "@/components/ui/BlueprintFrame";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { SplitLayout } from "@/components/layout/SplitLayout";
import { BrandPanel } from "@/features/auth/BrandPanel";
import { getBrandContent } from "@/features/auth/content";
import { SignInForm, type SignInValues } from "@/features/auth/SignInForm";

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
export const SignIn = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const search = useSearch({ from: "/sign-in" });
	const [pending, setPending] = useState(false);
	const [failure, setFailure] = useState<AuthFailure>();
	const handleSubmit = async ({
		email,
		password,
	}: SignInValues): Promise<void> => {
		setFailure(undefined);
		setPending(true);
		try {
			await signIn(email, password);
			await navigate({ to: search.redirect ?? "/" });
		} catch (error) {
			setFailure(error instanceof AuthenticationError ? error.kind : "Unknown");
		} finally {
			setPending(false);
		}
	};
	return (
		<SplitLayout aside={<BrandPanel {...getBrandContent(t)} />}>
			<div className="grid w-full max-w-md gap-5">
				<BlueprintFrame className="bg-surface p-7 md:p-10">
					<p className="text-xs uppercase tracking-[0.2em] text-steel-500">
						{t("auth.cardKicker")}
					</p>
					<h2 className="mt-2 font-heading text-5xl">{t("auth.heading")}</h2>
					<p className="mb-8 mt-2 text-steel-700">{t("auth.subtitle")}</p>
					<SignInForm
						error={failure ? t(errorKeys[failure]) : undefined}
						pending={pending}
						onSubmit={handleSubmit}
					/>
					<p className="mt-6 text-sm text-steel-700">{t("auth.access")}</p>
				</BlueprintFrame>
				<div className="flex justify-end">
					<LanguageSwitcher />
				</div>
			</div>
		</SplitLayout>
	);
};
