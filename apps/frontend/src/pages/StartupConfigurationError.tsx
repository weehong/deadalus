import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { BlueprintFrame } from "@/components/ui/BlueprintFrame";

type StartupConfigurationErrorProps = {
	missingVariables: Array<string>;
};

/** Rendered instead of the app when the provider is not configured, naming what is missing. */
export const StartupConfigurationError = ({
	missingVariables,
}: StartupConfigurationErrorProps): FunctionComponent => {
	const { t } = useTranslation();
	return (
		<main className="grid min-h-screen place-items-center p-6">
			<BlueprintFrame
				as="section"
				className="flex w-full max-w-2xl flex-col gap-3 p-8 md:p-12"
				role="alert"
			>
				<p className="m-0 text-[11px] tracking-[0.18em] uppercase text-accent-700">
					{t("configuration.kicker")}
				</p>
				<h1 className="m-0 text-[32px]">{t("configuration.heading")}</h1>
				<p className="m-0 text-ink/70">{t("configuration.body")}</p>
				<ul className="m-0 list-inside list-disc font-mono text-sm">
					{missingVariables.map((variable) => (
						<li key={variable}>{variable}</li>
					))}
				</ul>
				<p className="m-0 text-ink/70">{t("configuration.hint")}</p>
			</BlueprintFrame>
		</main>
	);
};
