import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className = "", ...props }, ref) => (
	<input ref={ref} {...props} className={`min-h-11 w-full border border-rule bg-surface px-3 py-2 text-ink placeholder:text-steel-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal-500 aria-invalid:border-signal-500 ${className}`} />
));
Input.displayName = "Input";
