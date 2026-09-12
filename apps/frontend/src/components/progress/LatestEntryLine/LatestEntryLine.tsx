import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/common/format-date-time";
import type { LatestEntry } from "@/common/items";

/**
 * An Item's latest Progress entry in one line: its value, author and moment,
 * or "No entries yet." Beneath the Item's name on the Console's Unit card
 * and the Field's Unit screen alike.
 */
export const LatestEntryLine = ({
	latest,
}: {
	latest: LatestEntry | null;
}): React.ReactElement => {
	const { t, i18n } = useTranslation();
	return (
		<p className="m-0 text-sm text-ink/70">
			{latest ? (
				<>
					{t("projects.progress.latest", {
						value: latest.value,
						name: latest.enteredByName,
					})}
					{" · "}
					<time dateTime={latest.createdAt}>
						{formatDateTime(latest.createdAt, i18n.language)}
					</time>
				</>
			) : (
				t("projects.progress.noEntries")
			)}
		</p>
	);
};
