import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { BlueprintFrame } from "@/components/ui/BlueprintFrame";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";
import { signInWithPhone } from "@/features/field/api";
import { FieldSignInForm } from "@/features/field/FieldSignInForm";
import type { FieldSignInValues } from "@/features/field/fieldSignInSchema";
import {
	mapSignInError,
	type FieldSignInFailure,
} from "@/features/field/signInFailure";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

const errorKeys: Record<
	FieldSignInFailure,
	| "field.signIn.errors.notRegistered"
	| "field.signIn.errors.rateLimited"
	| "field.signIn.errors.unavailable"
	| "field.signIn.errors.unknown"
> = {
	NotRegistered: "field.signIn.errors.notRegistered",
	RateLimited: "field.signIn.errors.rateLimited",
	Unavailable: "field.signIn.errors.unavailable",
	Unknown: "field.signIn.errors.unknown",
};

/**
 * The Field's Sign in: one column, the phone number and nothing else. A
 * Member sent here from a screen they asked for — a scanned QR label, most
 * often — lands back on it once the Session has started.
 */
export const FieldSignInPage = ({
	returnTo,
}: {
	/** Where to land after signing in; the Field's Projects without one. */
	returnTo?: string;
}): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const start = useMemberSessionStore((state) => state.start);
	const ended = useMemberSessionStore((state) => state.ended);
	const [pending, setPending] = useState(false);
	const [failure, setFailure] = useState<FieldSignInFailure>();

	const handleSubmit = async ({ phone }: FieldSignInValues): Promise<void> => {
		setFailure(undefined);
		setPending(true);
		try {
			start(await signInWithPhone(phone));
			// `href` takes a validated Field path as it stands; `to` is the typed
			// fallback when the Member came here of their own accord.
			await (returnTo
				? navigate({ href: returnTo })
				: navigate({ to: "/field" }));
		} catch (error) {
			setFailure(mapSignInError(error));
		} finally {
			setPending(false);
		}
	};

	return (
		<main className="min-h-screen bg-canvas px-4 py-8">
			<div className="mx-auto grid w-full max-w-[400px] gap-5">
				<Logo size="large" />
				<BlueprintFrame className="flex flex-col gap-4 p-6">
					<div>
						<p className="m-0 text-[11px] tracking-[0.16em] uppercase text-accent-700">
							{t("field.signIn.kicker")}
						</p>
						<h1 className="mb-1 text-[25px]">{t("field.signIn.heading")}</h1>
						<p className="m-0 text-[13px] text-ink/55">
							{t("field.signIn.subtitle")}
						</p>
					</div>
					{ended === "expired" && (
						<p className="m-0 text-[13px] text-ink/70" role="status">
							{t("field.signIn.sessionEnded")}
						</p>
					)}
					<FieldSignInForm
						error={failure ? t(errorKeys[failure]) : undefined}
						pending={pending}
						onSubmit={handleSubmit}
					/>
					<p className="m-0 text-xs text-ink/55">{t("field.signIn.access")}</p>
				</BlueprintFrame>
				<LanguageSwitcher className="justify-self-end" />
			</div>
		</main>
	);
};
