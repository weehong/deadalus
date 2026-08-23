import { cloneElement, type ReactElement, type ReactNode } from "react";

type FieldProps = { children: ReactElement; error?: string; id: string; label: ReactNode };
export const Field = ({ children, error, id, label }: FieldProps) => {
	const errorId = `${id}-error`;
	return (
		<div className="grid gap-2">
			<label className="text-sm font-semibold" htmlFor={id}>{label}</label>
			{cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? errorId : undefined } as object)}
			{error && <p className="text-sm text-signal-500" id={errorId}>{error}</p>}
		</div>
	);
};
 
