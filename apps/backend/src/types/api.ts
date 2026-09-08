/** Successful response envelope. */
export interface ApiResponse<T> {
	readonly data: T;
}

/** Error response envelope returned by the central error handler. */
export interface ApiError {
	readonly error: {
		readonly code: string;
		readonly message: string;
		readonly details?: unknown;
	};
}
