import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/common/api";
import { DeleteSubcontractorDialog } from "./DeleteSubcontractorDialog";
import { useDeleteSubcontractor } from "./useDeleteSubcontractor";
import { RenameSubcontractorForm } from "./RenameSubcontractorForm";
import { useRenameSubcontractor } from "./useRenameSubcontractor";
import type {
	MemberFailure,
	MemberValues,
	RenameSubcontractorFailure,
	RenameSubcontractorValues,
} from "./formSchemas";
import { MembersTable } from "./MembersTable";
import { MemberRowForm } from "./MemberRowForm";
import { useSaveMember } from "./useSaveMember";
import type { Member } from "./api";
import {
	useRemoveMember,
	useSubcontractorQuery,
} from "./useSubcontractorsQuery";

export const SubcontractorPage = ({
	id,
}: {
	id: string;
}): React.ReactElement => {
	const { t } = useTranslation();
	const query = useSubcontractorQuery(id);
	const navigate = useNavigate();
	const deletion = useDeleteSubcontractor(id);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const rename = useRenameSubcontractor(id);
	const submitRename = async (
		values: RenameSubcontractorValues
	): Promise<RenameSubcontractorFailure | void> => {
		try {
			await rename.mutateAsync(values);
			setRenaming(false);
		} catch (error) {
			if (
				error instanceof ApiRequestError &&
				error.status === 409 &&
				error.code === "SUBCONTRACTOR_NAME_TAKEN"
			)
				return { field: "name", message: t("subcontractors.form.nameTaken") };
			return { message: t("subcontractors.rename.error") };
		}
	};
	const removal = useRemoveMember(id);
	const saving = useSaveMember(id);
	const [editor, setEditor] = useState<{ member?: Member } | null>(null);
	const submitMember = async (
		values: MemberValues
	): Promise<MemberFailure | void> => {
		try {
			await saving.mutateAsync({ memberId: editor?.member?.id, values });
			setEditor(null);
		} catch (error) {
			if (
				error instanceof ApiRequestError &&
				error.code === "MEMBER_PHONE_TAKEN"
			) {
				const details = z
					.object({ subcontractorName: z.string() })
					.safeParse(error.details);
				return {
					field: "phone",
					message: details.success
						? t("subcontractors.form.phoneTaken", {
								name: details.data.subcontractorName,
							})
						: t("subcontractors.form.phoneTakenUnknown"),
				};
			}
			return { message: t("subcontractors.member.error") };
		}
	};
	const cancelMember = (): void => {
		setEditor(null);
	};
	const memberForm = editor ? (
		<MemberRowForm
			key={editor.member?.id ?? "add"}
			member={editor.member}
			pending={saving.isPending}
			onCancel={cancelMember}
			onSubmit={submitMember}
		/>
	) : null;
	const notFound =
		query.error instanceof ApiRequestError && query.error.status === 404;
	const refusal =
		deletion.error instanceof ApiRequestError &&
		deletion.error.code === "SUBCONTRACTOR_HAS_ASSIGNMENTS"
			? z
					.object({ itemCount: z.number().int().nonnegative() })
					.safeParse(deletion.error.details)
			: undefined;
	const assignedItemCount = refusal?.success
		? refusal.data.itemCount
		: undefined;
	return (
		<Page>
			<Link
				className="mb-5 inline-block text-sm text-accent-700 underline underline-offset-4"
				to="/subcontractors"
			>
				{t("subcontractors.detail.back")}
			</Link>
			<div className="[&_h1]:break-words [&_header>div]:min-w-0">
				{renaming && query.data && !query.isError ? (
					<header className="mb-6">
						<p className="m-0 text-[11px] tracking-[0.16em] uppercase text-accent-700">
							{t("subcontractors.detail.kicker")}
						</p>
						<RenameSubcontractorForm
							key={id}
							name={query.data.name}
							pending={rename.isPending}
							onSubmit={submitRename}
							onCancel={(): void => {
								setRenaming(false);
							}}
						/>
					</header>
				) : (
					<PageHeader
						kicker={t("subcontractors.detail.kicker")}
						actions={
							query.data && !query.isError ? (
								<>
									<Button
										variant="secondary"
										onClick={(): void => {
											setRenaming(true);
										}}
									>
										{t("subcontractors.rename.action")}
									</Button>
									<Button
										variant="secondary"
										onClick={(): void => {
											deletion.reset();
											setDeleteOpen(true);
										}}
									>
										{t("subcontractors.delete.action")}
									</Button>
								</>
							) : undefined
						}
						heading={
							query.data?.name ??
							t(
								notFound
									? "subcontractors.detail.notFound"
									: "subcontractors.detail.kicker"
							)
						}
					/>
				)}
			</div>
			{query.isPending ? (
				<p role="status">{t("subcontractors.detail.loading")}</p>
			) : notFound ? (
				<p>{t("subcontractors.detail.notFoundBody")}</p>
			) : query.isError ? (
				<Alert>
					<p>{t("subcontractors.detail.error")}</p>
					<Button
						pending={query.isFetching}
						variant="secondary"
						onClick={(): void => {
							void query.refetch();
						}}
					>
						{t("subcontractors.retry")}
					</Button>
				</Alert>
			) : (
				<>
					{removal.isError ? (
						<Alert>
							{t(
								removal.error instanceof ApiRequestError &&
									removal.error.code === "LAST_MEMBER"
									? "subcontractors.remove.lastMember"
									: "subcontractors.remove.error"
							)}
						</Alert>
					) : null}
					<MembersTable
						editForm={memberForm}
						editingDisabled={editor !== null}
						editingMemberId={editor?.member?.id}
						members={query.data.members}
						removingMemberId={removal.isPending ? removal.variables : undefined}
						footer={
							editor?.member ? undefined : editor ? (
								memberForm
							) : (
								<Button
									disabled={removal.isPending}
									variant="secondary"
									onClick={(): void => {
										removal.reset();
										setEditor({});
									}}
								>
									{t("subcontractors.member.add")}
								</Button>
							)
						}
						onEdit={(member): void => {
							removal.reset();
							setEditor({ member });
						}}
						onRemove={(memberId): void => {
							removal.mutate(memberId);
						}}
					/>
				</>
			)}
			{query.data && (
				<DeleteSubcontractorDialog
					assignedItemCount={assignedItemCount}
					error={deletion.isError && assignedItemCount === undefined}
					memberCount={query.data.members.length}
					name={query.data.name}
					open={deleteOpen}
					pending={deletion.isPending}
					onCancel={(): void => {
						setDeleteOpen(false);
					}}
					onConfirm={(): void => {
						deletion.mutate(undefined, {
							onSuccess: (): void => {
								setDeleteOpen(false);
								void navigate({ to: "/subcontractors" });
							},
						});
					}}
				/>
			)}
		</Page>
	);
};
