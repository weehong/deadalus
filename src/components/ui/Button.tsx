import type { ButtonHTMLAttributes } from "react";
import { BlueprintFrame } from "./BlueprintFrame";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	block?: boolean;
	framed?: boolean;
	pending?: boolean;
	variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
	primary: "bg-signal-500 text-white border-signal-500 hover:bg-signal-400",
	secondary: "bg-transparent text-ink border-ink hover:bg-steel-100",
	ghost: "bg-transparent text-ink border-transparent hover:bg-steel-100",
	icon: "bg-transparent text-ink border-transparent hover:bg-steel-100 aspect-square",
};

export const Button = ({ block = false, children, className = "", disabled, framed = false, pending = false, variant = "primary", ...props }: ButtonProps) => {
	const button = (
		<button
			{...props}
			aria-busy={pending}
			className={`inline-flex min-h-11 items-center justify-center gap-2 border px-5 py-2 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-500 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${block ? "w-full" : ""} ${className}`}
			disabled={disabled === true || pending}
		>
			{pending && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
			{children}
		</button>
	);
	return framed ? <BlueprintFrame className={block ? "w-full" : "inline-block"}>{button}</BlueprintFrame> : button;
};
 
