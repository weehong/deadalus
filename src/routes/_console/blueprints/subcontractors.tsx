/* eslint-disable camelcase, no-use-before-define -- provider-shaped payloads and route composition */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeading } from "@/components/ui/PageHeading";
import { Table } from "@/components/ui/Table";
import {
	floorPlanHooks,
	scopeAssignmentHooks,
	storeyHooks,
	subcontractorHooks,
	unitHooks,
	useSitesQuery,
} from "@/features/blueprints/data/hooks";
import type {
	ScopeCode,
	Subcontractor,
} from "@/features/blueprints/data/database";
import {
	ScopeChecklist,
	ScopeSummary,
	SubcontractorDialog,
	useScopeMutation,
	type SubcontractorValues,
} from "@/features/blueprints/subcontractors";

const SubcontractorsPage = () => {
	const { t } = useTranslation();
	const { data: sites = [], isLoading } = useSitesQuery();
	const site = sites[0];
	if (isLoading) return <p role="status">{t("blueprints.loading")}</p>;
	if (!site) return <p>{t("blueprints.noSite")}</p>;
	return <SubcontractorsForSite siteId={site.id} siteName={site.name} />;
};

const SubcontractorsForSite = ({
	siteId,
	siteName,
}: {
	siteId: string;
	siteName: string;
}) => {
	const { t } = useTranslation();
	const { data: subcontractors = [] } = subcontractorHooks.useList(siteId);
	const { data: assignments = [] } = scopeAssignmentHooks.useList(siteId);
	const { data: storeys = [] } = storeyHooks.useList(siteId);
	const { data: floorPlans = [] } = floorPlanHooks.useList(siteId);
	const { data: units = [] } = unitHooks.useList(siteId);
	const create = subcontractorHooks.useCreate(siteId);
	const update = subcontractorHooks.useUpdate(siteId);
	const remove = subcontractorHooks.useDelete(siteId);
	const [selectedId, setSelectedId] = useState<string>();
	const [editing, setEditing] = useState<Subcontractor | "new">();
	const [deleting, setDeleting] = useState<Subcontractor>();
	const [alert, setAlert] = useState<string>();
	const selected =
		subcontractors.find((item) => item.id === selectedId) ?? subcontractors[0];
	const toggle = useScopeMutation(siteId, () => {
		setAlert(t("blueprints.scope.saveError"));
	});
	const toggleItem = (unitId: string, code: ScopeCode, checked: boolean) => {
		if (selected)
			toggle.mutate({
				checked,
				code,
				siteId,
				subcontractorId: selected.id,
				unitId,
			});
	};
	const submit = async (values: SubcontractorValues) => {
		const payload = {
			...values,
			contact_person: values.contact_person || null,
			phone: values.phone || null,
			email: values.email || null,
			contract_reference: values.contract_reference || null,
			site_id: siteId,
		};
		if (editing === "new") await create.mutateAsync(payload);
		else if (editing)
			await update.mutateAsync({ id: editing.id, value: payload });
		setEditing(undefined);
	};
	return (
		<main>
			<PageHeading
				context={siteName}
				title={t("blueprints.subcontractors")}
				actions={
					<Button
						onClick={() => {
							setEditing("new");
						}}
					>
						{t("blueprints.scope.add")}
					</Button>
				}
			/>
			{alert && <p role="alert">{alert}</p>}
			{subcontractors.length === 0 ? (
				<section>
					<h2>{t("blueprints.scope.empty")}</h2>
					<p>{t("blueprints.scope.emptyHelp")}</p>
				</section>
			) : (
				<>
					<Table>
						<thead>
							<tr>
								<th>{t("blueprints.scope.company")}</th>
								<th>{t("blueprints.scope.trade")}</th>
								<th>{t("blueprints.scope.items")}</th>
								<th>{t("blueprints.scope.actions")}</th>
							</tr>
						</thead>
						<tbody>
							{subcontractors.map((item) => (
								<tr key={item.id}>
									<td>
										<button
											type="button"
											onClick={() => {
												setSelectedId(item.id);
											}}
										>
											{item.company_name}
										</button>
									</td>
									<td>{item.trade}</td>
									<td>
										{
											assignments.filter((a) => a.subcontractor_id === item.id)
												.length
										}
									</td>
									<td>
										<button
											type="button"
											onClick={() => {
												setEditing(item);
											}}
										>
											{t("blueprints.scope.edit")}
										</button>{" "}
										<button
											type="button"
											onClick={() => {
												setDeleting(item);
											}}
										>
											{t("blueprints.scope.delete")}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
					{selected && (
						<>
							<ScopeChecklist
								assignments={assignments}
								floorPlans={floorPlans}
								selected={selected}
								storeys={storeys}
								subcontractors={subcontractors}
								units={units}
								onToggleItem={toggleItem}
								onClear={() => {
									assignments
										.filter((a) => a.subcontractor_id === selected.id)
										.forEach((a) => {
											toggleItem(a.unit_id, a.scope_code, false);
										});
								}}
								onToggleUnit={(unitId, codes) => {
									const current = assignments.filter(
										(a) =>
											a.unit_id === unitId && a.subcontractor_id === selected.id
									);
									current
										.filter((a) => !codes.includes(a.scope_code))
										.forEach((a) => {
											toggleItem(unitId, a.scope_code, false);
										});
									codes
										.filter(
											(code) => !current.some((a) => a.scope_code === code)
										)
										.forEach((code) => {
											toggleItem(unitId, code, true);
										});
								}}
							/>
							<ScopeSummary
								assignments={assignments}
								selected={selected}
								units={units}
							/>
						</>
					)}
				</>
			)}
			{editing && (
				<SubcontractorDialog
					open
					initial={editing === "new" ? undefined : editing}
					onSubmit={submit}
					onClose={() => {
						setEditing(undefined);
					}}
				/>
			)}{" "}
			{deleting && (
				<ConfirmDialog
					open
					cancelLabel={t("blueprints.form.cancel")}
					confirmLabel={t("blueprints.scope.delete")}
					itemName={deleting.company_name}
					title={t("blueprints.scope.deleteTitle")}
					onClose={() => {
						setDeleting(undefined);
					}}
					onConfirm={() => {
						void remove.mutateAsync(deleting.id).then(() => {
							setDeleting(undefined);
						});
					}}
				/>
			)}
		</main>
	);
};

export const Route = createFileRoute("/_console/blueprints/subcontractors")({
	component: SubcontractorsPage,
});
