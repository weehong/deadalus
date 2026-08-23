import {
	createElement,
	type ComponentPropsWithoutRef,
	type ElementType,
	type ReactNode,
} from "react";

type BlueprintFrameProps<TElement extends ElementType> = {
	as?: TElement;
	children: ReactNode;
	className?: string;
} & Omit<ComponentPropsWithoutRef<TElement>, "as" | "children" | "className">;

export const BlueprintFrame = <TElement extends ElementType = "div">({
	as,
	children,
	className = "",
	...props
}: BlueprintFrameProps<TElement>) =>
	createElement(
		as ?? "div",
		{ ...props, className: `relative border border-rule ${className}` },
		<>
			{children}
			{[
				"-left-1 -top-1",
				"-right-1 -top-1",
				"-bottom-1 -left-1",
				"-bottom-1 -right-1",
			].map((position) => (
				<span
					key={position}
					aria-hidden="true"
					className={`absolute h-2 w-2 ${position}`}
				>
					<span className="absolute left-1/2 top-0 h-full border-l border-current" />
					<span className="absolute left-0 top-1/2 w-full border-t border-current" />
				</span>
			))}
		</>
	);
