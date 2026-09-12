import { useState } from "react";

export interface Submission<R> {
	pending: boolean;
	/** The failure line once a submission has been refused. */
	error?: string;
	/** The API's answer once a submission has succeeded. */
	result?: R;
	/** Run one submission: busy until it settles, then its answer or the failure line. */
	submit: (run: () => Promise<R>) => Promise<void>;
}

/**
 * A dialog's own submission state, so the page that opens it need only know
 * which dialog is open for which Catalogue Item. A rejection of `run` is
 * shown as `failure`; the page maps what it must before rethrowing.
 */
export const useSubmission = <R>(failure: string): Submission<R> => {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string>();
	const [result, setResult] = useState<R>();
	const submit = async (run: () => Promise<R>): Promise<void> => {
		setPending(true);
		setError(undefined);
		try {
			setResult(await run());
		} catch {
			setError(failure);
		} finally {
			setPending(false);
		}
	};
	return { pending, error, result, submit };
};
