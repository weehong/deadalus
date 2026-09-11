import {
	Dialog as HeadlessDialog,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import type { ReactNode } from "react";

/** A labelled modal with focus containment, Escape dismissal and focus restoration. */
export const Dialog = ({
	open,
	title,
	children,
	onClose,
}: {
	open: boolean;
	title: string;
	children: ReactNode;
	onClose: () => void;
}): React.ReactElement => (
	<HeadlessDialog className="fixed inset-0 z-50" open={open} onClose={onClose}>
		<div aria-hidden="true" className="fixed inset-0 bg-ink/40" />
		<div className="fixed inset-0 overflow-y-auto p-4">
			<div className="flex min-h-full items-center justify-center">
				<DialogPanel className="w-full max-w-md break-words border border-rule bg-canvas p-6 shadow-xl">
					<DialogTitle className="mb-4 font-heading text-2xl font-semibold text-ink">
						{title}
					</DialogTitle>
					{children}
				</DialogPanel>
			</div>
		</div>
	</HeadlessDialog>
);
