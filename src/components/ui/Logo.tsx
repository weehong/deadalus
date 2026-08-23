type LogoProps = { className?: string; size?: "small" | "large" };
export const Logo = ({ className = "", size = "small" }: LogoProps) => (
	<div
		aria-label="Daedalus Ops"
		className={`inline-flex items-center gap-3 font-heading font-semibold uppercase tracking-wider ${size === "large" ? "text-3xl" : "text-xl"} ${className}`}
	>
		<span
			aria-hidden="true"
			className="relative inline-block h-7 w-7 border border-current after:absolute after:left-1/2 after:top-[-5px] after:h-[calc(100%+10px)] after:border-l after:border-current before:absolute before:left-[-5px] before:top-1/2 before:w-[calc(100%+10px)] before:border-t before:border-current"
		/>
		Daedalus Ops
	</div>
);
