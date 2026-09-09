import type { ComponentPropsWithRef } from "react";
import { BlueprintFrame } from "@/components/ui/BlueprintFrame";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonProps = ComponentPropsWithRef<"button"> & {
	/** Stretch to the full width of the container. */
	block?: boolean;
	/** Wrap in the blueprint frame; the system's primary buttons wear it. */
	framed?: boolean;
	/** Show a spinner, announce busy and refuse further presses. */
	pending?: boolean;
	variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
	primary:
		"border-accent bg-accent text-canvas hover:bg-accent-600 active:bg-accent-700",
	secondary:
		"border-rule bg-transparent text-ink hover:bg-ink/7 active:bg-ink/14",
	ghost:
		"border-transparent bg-transparent px-1 text-accent hover:bg-accent/10 active:bg-accent/18",
};

export const Button = ({
	block = false,
	children,
	className = "",
	disabled,
	framed = false,
	pending = false,
	type = "button",
	variant = "primary",
	...props
}: ButtonProps): React.ReactElement => {
	const button = (
		<button
			{...props}
			aria-busy={pending}
			className={`inline-flex min-h-10 items-center justify-center gap-2 border px-3 py-2 font-heading text-sm font-semibold leading-tight transition focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${block ? "w-full" : ""} ${className}`}
			data-variant={variant}
			disabled={disabled === true || pending}
			type={type}
		>
			{pending && (
				<span
					aria-hidden="true"
					className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
				/>
			)}
			{children}
		</button>
	);
	return framed ? (
		<BlueprintFrame className={block ? "w-full" : "inline-block"}>
			{button}
		</BlueprintFrame>
	) : (
		button
	);
};
