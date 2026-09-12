import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";

type FieldHeaderProps = {
	memberName: string;
	subcontractorName: string;
	onSignOut: () => void;
};

/**
 * The Field's minimal header: who is signed in, which Subcontractor they
 * belong to, and Sign out as a thumb-sized control. Sticks to the top so
 * Sign out is never more than a reach away on a long screen.
 */
export const FieldHeader = ({
	memberName,
	subcontractorName,
	onSignOut,
}: FieldHeaderProps): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<header
			aria-label={t("field.header.label")}
			className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-rule bg-canvas px-4 py-2"
		>
			<div className="min-w-0 flex-1 leading-tight">
				<span
					className="block truncate font-heading text-base font-semibold"
					title={memberName}
				>
					{memberName}
				</span>
				<span
					className="block truncate text-xs text-ink/60"
					title={subcontractorName}
				>
					{subcontractorName}
				</span>
			</div>
			<Button
				className="h-[44px] flex-none px-4"
				variant="secondary"
				onClick={onSignOut}
			>
				{t("field.header.signOut")}
			</Button>
		</header>
	);
};
