import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Insert, TableName, Update } from "./database";
import type { EntityModule } from "./entityModule";

export const blueprintKeys = {
	all: ["blueprints"] as const,
	entity: (table: TableName, siteId: string) =>
		[...blueprintKeys.all, table, siteId] as const,
	detail: (table: TableName, id: string) =>
		[...blueprintKeys.all, table, "detail", id] as const,
};

export const makeEntityHooks = <T extends TableName>(
	table: T,
	api: EntityModule<T>
) => ({
	useList(siteId: string) {
		return useQuery({
			queryKey: blueprintKeys.entity(table, siteId),
			queryFn: () => api.list(siteId),
			enabled: Boolean(siteId),
		});
	},
	useRead(id: string) {
		return useQuery({
			queryKey: blueprintKeys.detail(table, id),
			queryFn: () => api.read(id),
			enabled: Boolean(id),
		});
	},
	useCreate(siteId: string) {
		const client = useQueryClient();
		return useMutation({
			mutationFn: (value: Insert<T>) => api.create(value),
			onSuccess: () =>
				client.invalidateQueries({
					queryKey: blueprintKeys.entity(table, siteId),
				}),
		});
	},
	useUpdate(siteId: string) {
		const client = useQueryClient();
		return useMutation({
			mutationFn: ({ id, value }: { id: string; value: Update<T> }) =>
				api.update(id, value),
			onSuccess: () =>
				client.invalidateQueries({
					queryKey: blueprintKeys.entity(table, siteId),
				}),
		});
	},
	useDelete(siteId: string) {
		const client = useQueryClient();
		return useMutation({
			mutationFn: (id: string) => api.remove(id),
			onSuccess: () =>
				client.invalidateQueries({
					queryKey: blueprintKeys.entity(table, siteId),
				}),
		});
	},
});
