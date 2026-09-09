import type { ReactNode } from "react";
import { BlueprintFrame } from "@/components/ui/BlueprintFrame";

/** A framed notice standing in for a screen that is not built yet. */
export const Placeholder = ({
	children,
}: {
	children: ReactNode;
}): React.ReactElement => (
	<BlueprintFrame className="p-7">
		<p className="m-0 max-w-[60ch] text-[15px] text-ink/70">{children}</p>
	</BlueprintFrame>
);
