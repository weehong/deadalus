import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ApiRequestError } from "@/common/api";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateSubcontractorForm } from "./CreateSubcontractorForm";
import type {
	CreateSubcontractorFailure,
	CreateSubcontractorValues,
} from "./formSchemas";
import { useCreateSubcontractor } from "./useCreateSubcontractor";

const phoneConflictDetails = z.object({
	subcontractorId: z.string(),
	subcontractorName: z.string(),
});
export const CreateSubcontractorPage = (): React.ReactElement => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const mutation = useCreateSubcontractor();
	const submit = async (
		values: CreateSubcontractorValues
	): Promise<CreateSubcontractorFailure | void> => {
		try {
			const subcontractor = await mutation.mutateAsync(values);
			await navigate({
				to: "/subcontractors/$id",
				params: { id: subcontractor.id },
			});
		} catch (error) {
			if (error instanceof ApiRequestError && error.status === 409) {
				if (error.code === "SUBCONTRACTOR_NAME_TAKEN")
					return { field: "name", message: t("subcontractors.form.nameTaken") };
				if (error.code === "MEMBER_PHONE_TAKEN") {
					const details = phoneConflictDetails.safeParse(error.details);
					return {
						field: "member.phone",
						message: details.success
							? t("subcontractors.form.phoneTaken", {
									name: details.data.subcontractorName,
								})
							: t("subcontractors.form.phoneTakenUnknown"),
					};
				}
			}
			return { message: t("subcontractors.create.error") };
		}
	};
	return (
		<Page>
			<PageHeader
				heading={t("subcontractors.create.heading")}
				kicker={t("console.subcontractors.kicker")}
			/>
			<CreateSubcontractorForm
				onSubmit={submit}
				onCancel={(): void => {
					void navigate({ to: "/subcontractors" });
				}}
			/>
		</Page>
	);
};
