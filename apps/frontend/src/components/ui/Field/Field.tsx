import { cloneElement, type ReactElement, type ReactNode } from "react";

type FieldProps = {
	/** The single control; receives `id`, `aria-invalid` and `aria-describedby`. */
	children: ReactElement;
	error?: string;
	id: string;
	label: ReactNode;
};

/** Pairs a label with one control and its error, with the association wired for assistive technology. */
export const Field = ({
	children,
	error,
	id,
	label,
}: FieldProps): React.ReactElement => {
	const errorId = `${id}-error`;
	return (
		<div className="grid gap-[5px]">
			<label className="text-xs text-ink/70" htmlFor={id}>
				{label}
			</label>
			{cloneElement(children, {
				id,
				"aria-invalid": error ? true : undefined,
				"aria-describedby": error ? errorId : undefined,
			} as object)}
			{error && (
				<p className="m-0 text-xs text-accent-800" id={errorId}>
					{error}
				</p>
			)}
		</div>
	);
};
