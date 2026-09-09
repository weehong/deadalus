import { useTranslation } from "react-i18next";
import { BlueprintFrame } from "@/components/ui/BlueprintFrame";
import { Logo } from "@/components/ui/Logo";

/**
 * Shown while the provider restores the Session on boot, so a reload never
 * flashes the sign-in screen at someone who is already signed in.
 */
export const BootLoadingState = (): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<div
			aria-busy="true"
			className="grid min-h-screen place-items-center bg-accent-900 p-6 text-canvas"
			role="status"
		>
			<BlueprintFrame className="flex w-full max-w-sm flex-col gap-6 border-accent-700 p-8 text-canvas">
				<Logo size="large" />
				<div className="h-px w-full overflow-hidden bg-accent-700">
					<span
						aria-hidden="true"
						className="block h-full w-1/3 animate-pulse bg-accent-300"
					/>
				</div>
				<p className="m-0 text-[11px] tracking-[0.18em] uppercase text-accent-300">
					{t("loading.restoringSession")}
				</p>
			</BlueprintFrame>
		</div>
	);
};
