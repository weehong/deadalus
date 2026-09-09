import type { ReactNode } from "react";
import { initialsFor } from "./initialsFor";

type AccountBlockProps = {
	/** Optional control beside the account identity. */
	action?: ReactNode;
	email: string;
	/** The role label shown under the email, e.g. "Administrator". */
	role: string;
};

/** Who is signed in: initials in a hairline square, the email, and the role. */
export const AccountBlock = ({
	action,
	email,
	role,
}: AccountBlockProps): React.ReactElement => (
	<div className="flex items-center gap-2">
		<span
			aria-hidden="true"
			className="grid size-[26px] flex-none place-items-center border border-rule font-heading text-xs"
		>
			{initialsFor(email)}
		</span>
		<span className="min-w-0 flex-1 text-xs leading-tight">
			<span className="block truncate" title={email}>
				{email}
			</span>
			<span className="block text-[10px] tracking-[0.1em] uppercase text-ink/55">
				{role}
			</span>
		</span>
		{action}
	</div>
);
