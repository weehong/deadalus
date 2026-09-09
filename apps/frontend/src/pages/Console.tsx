import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { signOut } from "@/auth/auth";
import type { FunctionComponent } from "@/common/types";
import { BlueprintFrame } from "@/components/ui/BlueprintFrame";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";
import { useMeQuery } from "@/features/auth/api";

/**
 * The guarded root. A placeholder until the console exists: it proves the
 * round trip by showing the identity the API read from the bearer token, and
 * offers the only action a signed-in Administrator has today — log out.
 */
export const Console = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const me = useMeQuery();
	const [pending, setPending] = useState(false);
	const [failed, setFailed] = useState(false);

	const handleLogOut = async (): Promise<void> => {
		setFailed(false);
		setPending(true);
		try {
			await signOut();
			await navigate({ to: "/login" });
		} catch {
			setFailed(true);
		} finally {
			setPending(false);
		}
	};

	return (
		<main className="mx-auto grid max-w-3xl gap-6 p-[clamp(24px,5vw,72px)]">
			<header className="flex items-center justify-between gap-4">
				<Logo size="large" />
				<LanguageSwitcher />
			</header>
			<BlueprintFrame className="flex flex-col gap-4 p-7">
				<p className="m-0 text-[11px] tracking-[0.18em] uppercase text-accent-700">
					{t("console.kicker")}
				</p>
				<h1 className="m-0 text-[32px]">{t("console.heading")}</h1>
				<p className="m-0 max-w-[60ch] text-[15px] text-ink/70">
					{t("console.body")}
				</p>
				<section
					aria-labelledby="identity-heading"
					className="grid gap-2 border-t border-rule pt-4"
				>
					<h2 className="m-0 text-base" id="identity-heading">
						{t("console.identityHeading")}
					</h2>
					{me.isPending && (
						<p className="m-0 text-sm text-ink/55" role="status">
							{t("console.identityPending")}
						</p>
					)}
					{me.isError && (
						<p className="m-0 text-sm text-accent-800" role="alert">
							{t("console.identityError")}
						</p>
					)}
					{me.isSuccess && (
						<dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
							<dt className="text-ink/55">{t("console.email")}</dt>
							<dd className="m-0">{me.data.email ?? "—"}</dd>
							<dt className="text-ink/55">{t("console.id")}</dt>
							<dd className="m-0 font-mono text-xs">{me.data.id}</dd>
						</dl>
					)}
				</section>
				<div className="flex flex-wrap items-center gap-4 border-t border-rule pt-4">
					<Button
						pending={pending}
						variant="secondary"
						onClick={() => void handleLogOut()}
					>
						{pending ? t("auth.loggingOut") : t("auth.logOut")}
					</Button>
					<Link
						className="text-sm text-accent underline-offset-[3px]"
						to="/example"
					>
						{t("console.exampleLink")}
					</Link>
					{failed && (
						<p className="m-0 text-sm text-accent-800" role="alert">
							{t("auth.errors.logOut")}
						</p>
					)}
				</div>
			</BlueprintFrame>
		</main>
	);
};
