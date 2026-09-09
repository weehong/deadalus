import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { signOut } from "@/auth/auth";
import type { FunctionComponent } from "@/common/types";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { AccountBlock, Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { NavLink } from "@/features/console/NavLink";
import { getConsoleNavigation } from "@/features/console/navigation";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * The Console, wired: the shell and sidebar are given the router's location,
 * the Session's identity, the navigation entries and the sign-out action.
 * Every guarded screen renders in its outlet.
 */
export const ConsoleLayout = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const pathname = useLocation({ select: (location) => location.pathname });
	const email = useAuthStore((state) => state.session?.user.email ?? "");
	const [pending, setPending] = useState(false);
	const [failed, setFailed] = useState(false);
	const signOutLabel = pending ? t("auth.signingOut") : t("auth.signOut");

	const handleSignOut = async (): Promise<void> => {
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
		<ConsoleShell
			closeMenuLabel={t("console.closeMenu")}
			openMenuLabel={t("console.menu")}
			pathname={pathname}
			sidebarLabel={t("console.sidebar")}
			sidebar={
				<Sidebar
					label={t("console.navigationLabel")}
					subtitle={t("console.subtitle")}
					foot={
						<>
							<AccountBlock
								email={email}
								role={t("console.role")}
								action={
									<Button
										aria-label={signOutLabel}
										className="size-8 min-h-8 flex-none p-0!"
										pending={pending}
										title={signOutLabel}
										variant="ghost"
										onClick={() => void handleSignOut()}
									>
										{!pending && (
											<ArrowRightOnRectangleIcon
												aria-hidden="true"
												className="size-4"
											/>
										)}
									</Button>
								}
							/>
							{failed && (
								<p className="m-0 text-xs text-accent-800" role="alert">
									{t("auth.errors.signOut")}
								</p>
							)}
							{/* Temporarily hidden from the Console. */}
							<div hidden>
								<LanguageSwitcher />
							</div>
						</>
					}
					navigation={getConsoleNavigation(t).map((entry) => (
						<NavLink key={entry.to} to={entry.to}>
							{entry.label}
						</NavLink>
					))}
				/>
			}
		>
			<Outlet />
		</ConsoleShell>
	);
};
