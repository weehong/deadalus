/** Successful response envelope. */
export interface ApiResponse<T> {
	readonly data: T;
	readonly meta?: PaginationMeta;
}

export interface PaginationMeta {
	readonly page: number;
	readonly pageSize: number;
	readonly total: number;
}

/** Error response envelope returned by the central error handler. */
export interface ApiError {
	readonly error: {
		readonly code: string;
		readonly message: string;
		readonly details?: unknown;
	};
}
