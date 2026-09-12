import type { ReactNode } from "react";
import { ApiRequestError } from "@/common/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

/** What a Field screen needs of its read; a `UseQueryResult` satisfies it. */
export type FieldQuery<T> =
	| { isPending: true }
	| {
			isPending: false;
			isError: true;
			error: Error;
			isFetching: boolean;
			refetch: () => unknown;
	  }
	| { isPending: false; isError: false; data: T };

/**
 * A Field screen's read in its three states before the screen itself: a
 * status line while pending, a not-found notice with a way back when the
 * API answers 404 (the Subcontractor holds nothing there), and otherwise
 * the failure with a thumb-sized Retry. The screen renders from the data.
 */
export const FieldQueryState = <T,>({
	query,
	loading,
	error,
	retry,
	notFound,
	children,
}: {
	query: FieldQuery<T>;
	loading: string;
	error: string;
	retry: string;
	/** What a 404 means here, and the way back; without it a 404 fails like any other read. */
	notFound?: { message: string; back: ReactNode };
	children: (data: T) => ReactNode;
}): React.ReactElement => {
	if (query.isPending) {
		return <p role="status">{loading}</p>;
	}
	if (query.isError) {
		if (
			notFound &&
			query.error instanceof ApiRequestError &&
			query.error.status === 404
		) {
			return (
				<div className="border border-rule p-6" role="status">
					<p className="m-0 mb-4 text-[15px] text-ink/70">{notFound.message}</p>
					{notFound.back}
				</div>
			);
		}
		return (
			<Alert>
				<p className="m-0 mb-2">{error}</p>
				<Button
					className="h-[44px]"
					pending={query.isFetching}
					variant="secondary"
					onClick={(): void => {
						void query.refetch();
					}}
				>
					{retry}
				</Button>
			</Alert>
		);
	}
	return <>{children(query.data)}</>;
};
