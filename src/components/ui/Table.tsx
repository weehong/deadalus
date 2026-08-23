import type { TableHTMLAttributes } from "react";

export type TableProps = TableHTMLAttributes<HTMLTableElement>;
export const Table = ({ className = "", ...props }: TableProps) => (
	<div className="overflow-x-auto">
		<table
			className={`industry-table w-full border-collapse text-left text-sm [&_tbody_tr:hover]:bg-steel-50 [&_td]:border-b [&_td]:border-rule [&_td]:px-4 [&_td]:py-3 [&_th]:border-b [&_th]:border-rule [&_th]:bg-steel-50 [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold ${className}`}
			{...props}
		/>
	</div>
);
