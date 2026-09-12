import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/common/api";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectForm } from "@/features/projects/ProjectForm";
import type {
	ProjectFailure,
	ProjectValues,
} from "@/features/projects/formSchemas";
import { useCreateProject } from "@/features/projects/useCreateProject";

export const CreateProjectPage = (): React.ReactElement => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const mutation = useCreateProject();
	const submit = async (
		values: ProjectValues
	): Promise<ProjectFailure | void> => {
		try {
			const project = await mutation.mutateAsync(values);
			await navigate({
				to: "/projects/$id",
				params: { id: project.id },
			});
		} catch (error) {
			if (error instanceof ApiRequestError && error.status === 409) {
				if (error.code === "PROJECT_NAME_TAKEN")
					return { field: "name", message: t("projects.form.nameTaken") };
				if (error.code === "PROJECT_CODE_TAKEN")
					return { field: "code", message: t("projects.form.codeTaken") };
			}
			return { message: t("projects.create.error") };
		}
	};
	return (
		<Page>
			<PageHeader
				heading={t("projects.create.heading")}
				kicker={t("console.projects.kicker")}
			/>
			<ProjectForm
				onSubmit={submit}
				onCancel={(): void => {
					void navigate({ to: "/projects" });
				}}
			/>
		</Page>
	);
};
