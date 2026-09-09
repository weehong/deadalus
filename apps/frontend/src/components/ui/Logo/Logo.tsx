type LogoProps = { className?: string; size?: "small" | "large" };

/** The Daedalus wordmark with its square mark, in the condensed face. */
export const Logo = ({
	className = "",
	size = "small",
}: LogoProps): React.ReactElement => (
	<div
		aria-label="Daedalus"
		className={`inline-flex items-center font-heading font-semibold uppercase tracking-[0.06em] ${size === "large" ? "gap-2.5 text-lg" : "gap-2 text-base"} ${className}`}
		role="img"
	>
		<span
			aria-hidden="true"
			className={`grid place-items-center border border-current ${size === "large" ? "size-5" : "size-4"}`}
		>
			<span
				className={
					size === "large" ? "size-2 bg-current" : "size-1.5 bg-current"
				}
			/>
		</span>
		Daedalus
	</div>
);
