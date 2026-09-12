/** Successful response envelope; `meta` carries page metadata or the counts of a bulk action. */
export interface ApiResponse<T, M = PaginationMeta> {
	readonly data: T;
	readonly meta?: M;
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
