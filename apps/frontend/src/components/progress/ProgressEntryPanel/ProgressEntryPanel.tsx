import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
	ProgressEntry,
	ProgressEntryInput,
	UnitItem,
} from "@/common/items";
import {
	progressEntryFailure,
	type ProgressEntryFailure,
} from "@/common/progress-entry-failure";
import { ProgressEntryForm } from "@/components/progress/ProgressEntryForm";
import { ProgressHistory } from "@/components/progress/ProgressHistory";

/** What the panel reads of an Item's history; a `UseQueryResult` satisfies it. */
export interface ProgressHistoryRead {
	data?: Array<ProgressEntry>;
	isLoading: boolean;
	isError: boolean;
	refetch: () => unknown;
}

export interface ProgressEntryPanelProps {
	item: UnitItem;
	/**
	 * The hook that reads the Item's history, called with `enabled` false
	 * until its History disclosure opens. The Console and the Field each
	 * bring their own, cached under their own keys.
	 */
	useHistory: (itemId: string, enabled: boolean) => ProgressHistoryRead;
	/** Another entry on this Item is in flight. */
	pending?: boolean;
	/** Enters progress on the Item; a rejection is the API's error and lands on the form. */
	onEnter: (itemId: string, input: ProgressEntryInput) => Promise<unknown>;
	/** Extra classes on the form's controls; the Field sizes them for a thumb. */
	controlClassName?: string;
	/** Extra classes on the History's buttons; the Field sizes them for a thumb. */
	buttonClassName?: string;
}

/**
 * One Item's "Enter progress" form and History disclosure, beneath its row on
 * the Console's Unit card and the Field's Unit screen. The history is read
 * only once the disclosure opens; the API's refusal of an entry is put on the
 * field it names, or on the form.
 */
export const ProgressEntryPanel = ({
	item,
	useHistory,
	pending = false,
	onEnter,
	controlClassName,
	buttonClassName,
}: ProgressEntryPanelProps): React.ReactElement => {
	const { t } = useTranslation();
	const [historyOpen, setHistoryOpen] = useState(false);
	const history = useHistory(item.id, historyOpen);
	const submit = async (
		input: ProgressEntryInput
	): Promise<ProgressEntryFailure | void> => {
		try {
			await onEnter(item.id, input);
		} catch (error) {
			return progressEntryFailure(error, (key) => t(key));
		}
	};
	return (
		<>
			<ProgressEntryForm
				controlClassName={controlClassName}
				itemName={item.name}
				pending={pending}
				unassigned={item.subcontractor === null}
				onSubmit={submit}
			/>
			<ProgressHistory
				buttonClassName={buttonClassName}
				entries={history.data}
				itemName={item.name}
				loading={history.isLoading}
				open={historyOpen}
				error={
					history.isError ? t("projects.progress.historyError") : undefined
				}
				onRetry={(): void => {
					void history.refetch();
				}}
				onToggle={(): void => {
					setHistoryOpen((value) => !value);
				}}
			/>
		</>
	);
};
