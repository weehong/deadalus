import {
	createElement,
	type ComponentPropsWithoutRef,
	type ElementType,
	type ReactNode,
} from "react";

/**
 * The Industry frame: a hairline box with four "+" registration marks. Every
 * card, dialog and primary button in the system wears it, so the marks are not
 * optional and the corners are never rounded.
 */
type BlueprintFrameProps<TElement extends ElementType> = {
	as?: TElement;
	children: ReactNode;
	className?: string;
} & Omit<ComponentPropsWithoutRef<TElement>, "as" | "children" | "className">;

const CORNERS = [
	"-left-[6px] -top-[6px]",
	"-right-[6px] -top-[6px]",
	"-bottom-[6px] -left-[6px]",
	"-bottom-[6px] -right-[6px]",
];

export const BlueprintFrame = <TElement extends ElementType = "div">({
	as,
	children,
	className = "",
	...props
}: BlueprintFrameProps<TElement>): React.ReactElement =>
	createElement(
		as ?? "div",
		{
			...props,
			className: `blueprint-frame relative border border-rule ${className}`,
		},
		<>
			{children}
			{CORNERS.map((position) => (
				<span
					key={position}
					aria-hidden="true"
					className={`blueprint-corner pointer-events-none absolute h-[11px] w-[11px] text-ink/55 ${position}`}
				>
					<span className="absolute top-0 left-[5px] h-full w-px bg-current" />
					<span className="absolute top-[5px] left-0 h-px w-full bg-current" />
				</span>
			))}
		</>
	);
