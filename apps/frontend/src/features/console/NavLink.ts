import { createLink, type LinkComponent } from "@tanstack/react-router";
import { NavItem } from "@/components/layout/Sidebar";

/** A NavItem driven by the router: typed `to`, and `aria-current` on the active route. */
export const NavLink: LinkComponent<typeof NavItem> = createLink(NavItem);
