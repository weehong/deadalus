import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { Member } from "./api";

interface MembersTableProps {
	members: Array<Member>;
	onRemove?: (memberId: string) => void;
	removingMemberId?: string;
	onEdit?: (member: Member) => void;
	editingMemberId?: string;
	editForm?: React.ReactNode;
	footer?: React.ReactNode;
	editingDisabled?: boolean;
}
export const MembersTable = ({
	members,
	onRemove,
	removingMemberId,
	onEdit,
	editingMemberId,
	editForm,
	footer,
	editingDisabled,
}: MembersTableProps): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<div className="border border-rule">
			<table
				aria-label={t("subcontractors.detail.members")}
				className="w-full table-fixed text-left text-sm"
			>
				<thead>
					<tr>
						<th
							className="border-b border-rule px-3 py-3 font-semibold break-words"
							scope="col"
						>
							{t("subcontractors.detail.name")}
						</th>
						<th
							className="border-b border-rule px-3 py-3 font-semibold break-words"
							scope="col"
						>
							{t("subcontractors.detail.phone")}
						</th>
						{onRemove || onEdit ? (
							<th
								className="border-b border-rule px-3 py-3 font-semibold break-words"
								scope="col"
							>
								{t("subcontractors.remove.actions")}
							</th>
						) : null}
					</tr>
				</thead>
				<tbody>
					{members.map((member) =>
						editingMemberId === member.id ? (
							<tr key={member.id} className="border-b border-rule">
								<td className="p-3" colSpan={onRemove || onEdit ? 3 : 2}>
									{editForm}
								</td>
							</tr>
						) : (
							<tr
								key={member.id}
								className="border-b border-rule last:border-0"
							>
								<td className="px-3 py-3 text-left align-middle break-words">
									{member.name}
								</td>
								<td className="px-3 py-3 text-left align-middle break-all">
									{member.phone}
								</td>
								{onRemove || onEdit ? (
									<td className="px-3 py-3 text-left align-middle">
										<div className="flex flex-wrap gap-2">
											{onEdit && (
												<Button
													className="max-w-full px-2"
													variant="secondary"
													aria-label={t("subcontractors.member.editLabel", {
														name: member.name,
													})}
													disabled={
														editingDisabled || Boolean(removingMemberId)
													}
													onClick={(): void => {
														onEdit(member);
													}}
												>
													{t("subcontractors.member.edit")}
												</Button>
											)}
											{onRemove && (
												<Button
													className="max-w-full px-2"
													pending={removingMemberId === member.id}
													variant="secondary"
													aria-label={t("subcontractors.remove.label", {
														name: member.name,
													})}
													disabled={
														editingDisabled || Boolean(removingMemberId)
													}
													onClick={(): void => {
														onRemove(member.id);
													}}
												>
													{t("subcontractors.remove.action")}
												</Button>
											)}
										</div>
									</td>
								) : null}
							</tr>
						)
					)}
				</tbody>
				{footer && (
					<tfoot>
						<tr>
							<td
								className="border-t border-rule p-3"
								colSpan={onRemove || onEdit ? 3 : 2}
							>
								{footer}
							</td>
						</tr>
					</tfoot>
				)}
			</table>
		</div>
	);
};
