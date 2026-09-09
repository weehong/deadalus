import { forwardRef, type InputHTMLAttributes } from "react";

/** A text control on the surface tone; forwards its ref so form libraries can register it. */
export const Input = forwardRef<
	HTMLInputElement,
	InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
	<input
		ref={ref}
		{...props}
		className={`min-h-9 w-full border border-rule bg-surface px-2.5 py-1.5 text-sm text-ink caret-accent placeholder:text-ink/40 hover:border-ink/45 focus-visible:border-accent focus-visible:outline-offset-0 aria-invalid:border-accent-700 ${className}`}
	/>
));
Input.displayName = "Input";
