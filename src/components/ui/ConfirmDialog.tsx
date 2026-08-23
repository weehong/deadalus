import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { Button } from "./Button";

export type ConfirmDialogProps = {
	blockedReason?: string;
	cancelLabel?: string;
	confirmLabel?: string;
	description?: string;
	itemName: string;
	onClose: () => void;
	onConfirm: () => void;
	open: boolean;
	title: string;
};
export const ConfirmDialog = ({
	blockedReason,
	cancelLabel = "Cancel",
	confirmLabel = "Delete",
	description,
	itemName,
	onClose,
	onConfirm,
	open,
	title,
}: ConfirmDialogProps) => (
	<Dialog className="relative z-50" open={open} onClose={onClose}>
		<DialogBackdrop className="fixed inset-0 bg-steel-900/60" />
		<div className="fixed inset-0 flex items-center justify-center p-4">
			<DialogPanel className="w-full max-w-md bg-surface p-6 shadow-xl">
				<DialogTitle className="font-heading text-2xl font-semibold uppercase">
					{title}
				</DialogTitle>
				<p className="mt-3 text-sm">
					{description ?? (
						<>
							Are you sure you want to delete <strong>{itemName}</strong>?
						</>
					)}
				</p>
				{blockedReason === undefined ? null : (
					<p
						className="mt-3 border-l-2 border-signal-500 pl-3 text-sm"
						role="status"
					>
						{blockedReason}
					</p>
				)}
				<div className="mt-6 flex justify-end gap-3">
					<Button variant="secondary" onClick={onClose}>
						{cancelLabel}
					</Button>
					<Button disabled={blockedReason !== undefined} onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</div>
			</DialogPanel>
		</div>
	</Dialog>
);
