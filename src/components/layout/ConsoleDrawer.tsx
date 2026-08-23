import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/ui/Logo";

type ConsoleDrawerProps = { sidebar: ReactNode };

export const ConsoleDrawer = ({ sidebar }: ConsoleDrawerProps) => {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	const closeAfterNavigation = (event: MouseEvent<HTMLElement>) => {
		if ((event.target as HTMLElement).closest("a[href]")) setOpen(false);
	};

	return (
		<>
			<header className="flex h-16 items-center justify-between border-b border-rule bg-steel-900 px-5 text-canvas md:hidden">
				<Logo />
				<button
					aria-expanded={open}
					aria-label={t("console.openNavigation")}
					className="grid size-10 place-items-center border border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas"
					type="button"
					onClick={() => {
						setOpen(true);
					}}
				>
					<Bars3Icon aria-hidden="true" className="size-6" />
				</button>
			</header>

			<Dialog
				aria-label={t("console.navigation")}
				className="relative z-50 md:hidden"
				open={open}
				onClose={setOpen}
			>
				<DialogBackdrop
					className="fixed inset-0 bg-steel-900/60"
					onClick={() => {
						setOpen(false);
					}}
				/>
				<div className="fixed inset-0 flex">
					<DialogPanel
						className="h-full w-[236px] max-w-[85vw]"
						onClick={closeAfterNavigation}
					>
						{sidebar}
					</DialogPanel>
				</div>
			</Dialog>
		</>
	);
};
