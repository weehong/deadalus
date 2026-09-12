import { useState } from "react";
import { ProjectForm } from "@/features/projects/ProjectForm";
import { DeleteProjectDialog } from "@/features/projects/DeleteProjectDialog";
import { useEditProject } from "@/features/projects/useEditProject";
import { useDeleteProject } from "@/features/projects/useDeleteProject";
import type { ProjectValues, ProjectFailure } from "@/features/projects/formSchemas";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/common/api";
import { useProjectQuery } from "@/features/projects/useProjectQuery";
export const ProjectLayout = ({ id }: { id: string }): React.ReactElement => {
	const { t } = useTranslation();
	const query = useProjectQuery(id);
	const navigate = useNavigate();
	const edit = useEditProject(id);
	const deletion = useDeleteProject(id);
	const [editing, setEditing] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const submit = async (
		values: ProjectValues
	): Promise<ProjectFailure | void> => {
		try {
			await edit.mutateAsync(values);
			setEditing(false);
		} catch (error) {
			if (error instanceof ApiRequestError && error.status === 409) {
				if (error.code === "PROJECT_NAME_TAKEN")
					return { field: "name", message: t("projects.form.nameTaken") };
				if (error.code === "PROJECT_CODE_TAKEN")
					return { field: "code", message: t("projects.form.codeTaken") };
			}
			return { message: t("projects.edit.error") };
		}
	};
	const notFound =
		query.error instanceof ApiRequestError && query.error.status === 404;
	return (
		<Page>
			<Link className="mb-4 inline-block text-sm underline" to="/projects">
				{t("projects.detail.back")}
			</Link>
			{query.isPending ? (
				<p role="status">{t("projects.detail.loading")}</p>
			) : notFound ? (
				<>
					<PageHeader heading={t("projects.detail.notFound")} />
					<p>{t("projects.detail.notFoundBody")}</p>
				</>
			) : query.isError ? (
				<Alert>
					<p>{t("projects.detail.error")}</p>
					<Button
						pending={query.isFetching}
						variant="secondary"
						onClick={(): void => {
							void query.refetch();
						}}
					>
						{t("projects.retry")}
					</Button>
				</Alert>
			) : (
				<>
					{editing ? (
						<div className="mb-6">
							<ProjectForm
								initialValues={{ name: query.data.name, code: query.data.code }}
								mode="edit"
								pending={edit.isPending}
								onSubmit={submit}
								onCancel={(): void => {
									setEditing(false);
								}}
							/>
						</div>
					) : (
						<PageHeader
							heading={query.data.name}
							kicker={query.data.code}
							actions={
								<>
									<Button
										variant="secondary"
										onClick={(): void => {
											setEditing(true);
										}}
									>
										{t("projects.edit.action")}
									</Button>
									<Button
										variant="secondary"
										onClick={(): void => {
											deletion.reset();
											setDeleting(true);
										}}
									>
										{t("projects.delete.action")}
									</Button>
								</>
							}
						/>
					)}
					<DeleteProjectDialog
						blockCount={query.data.blocks.length}
						error={deletion.isError}
						name={query.data.name}
						open={deleting}
						pending={deletion.isPending}
						storeyCount={
							query.data.blocks.flatMap((block) => block.storeys).length
						}
						unitCount={
							query.data.blocks
								.flatMap((block) => block.storeys)
								.flatMap((storey) => storey.units).length
						}
						onCancel={(): void => {
							setDeleting(false);
						}}
						onConfirm={(): void => {
							deletion.mutate(undefined, {
								onSuccess: (): void => {
									setDeleting(false);
									void navigate({ to: "/projects" });
								},
							});
						}}
					/>
					<nav
						aria-label={t("projects.detail.tabs")}
						className="mb-6 flex flex-wrap gap-4 border-b border-rule"
					>
						<Link
							activeOptions={{ exact: true, includeSearch: false }}
							className="py-3"
							params={{ id }}
							to="/projects/$id"
							activeProps={{
								"aria-current": "page",
								className: "border-b-2 border-ink font-semibold",
							}}
						>
							{t("projects.detail.structure")}
						</Link>
						<Link
							className="py-3"
							params={{ id }}
							to="/projects/$id/unit-types"
							activeProps={{
								"aria-current": "page",
								className: "border-b-2 border-ink font-semibold",
							}}
						>
							{t("projects.detail.unitTypes")}
						</Link>
					</nav>
					<Outlet />
				</>
			)}
		</Page>
	);
};
