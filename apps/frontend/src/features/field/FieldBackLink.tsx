import { Link } from "@tanstack/react-router";
import type { FieldProjectSearch } from "@/features/field/types";

/** Where a back link leads: the Projects screen, or a Project with a Block or Storey selected. */
export type FieldBackTarget =
	| { to: "projects" }
	| { to: "project"; id: string; search?: FieldProjectSearch };

const className =
	"inline-flex min-h-[44px] items-center gap-1 text-accent underline";

/** The thumb-sized "Back to …" link above a Field screen's heading, or beneath a not-found notice. */
export const FieldBackLink = ({
	label,
	target,
}: {
	label: string;
	target: FieldBackTarget;
}): React.ReactElement => {
	const chevron = <span aria-hidden="true">‹</span>;
	return target.to === "projects" ? (
		<Link className={className} to="/field">
			{chevron}
			{label}
		</Link>
	) : (
		<Link
			className={className}
			params={{ id: target.id }}
			search={target.search ?? {}}
			to="/field/projects/$id"
		>
			{chevron}
			{label}
		</Link>
	);
};
