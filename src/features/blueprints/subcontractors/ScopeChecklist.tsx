import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
	FloorPlan,
	ScopeAssignment,
	ScopeCode,
	Storey,
	Subcontractor,
	Unit,
} from "../data/database";
import {
	otherHolders,
	SCOPE_CODES,
	unitCheckState,
	unitToggleCodes,
} from "./model";
type Props = {
	assignments: Array<ScopeAssignment>;
	floorPlans: Array<FloorPlan>;
	onClear: () => void;
	onToggleItem: (unitId: string, code: ScopeCode, checked: boolean) => void;
	onToggleUnit: (unitId: string, codes: Array<ScopeCode>) => void;
	selected: Subcontractor;
	storeys: Array<Storey>;
	subcontractors: Array<Subcontractor>;
	units: Array<Unit>;
};
export const ScopeChecklist = ({
	assignments,
	floorPlans,
	onClear,
	onToggleItem,
	onToggleUnit,
	selected,
	storeys,
	subcontractors,
	units,
}: Props) => {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);
	return (
		<section aria-label={t("blueprints.scope.checklist")}>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => {
						setExpanded(true);
					}}
				>
					{t("blueprints.scope.expand")}
				</button>
				<button type="button" onClick={onClear}>
					{t("blueprints.scope.clear")}
				</button>
			</div>
			{storeys.map((storey) => (
				<details key={storey.id} open={expanded}>
					<summary>{storey.name}</summary>
					{floorPlans
						.filter((p) => p.storey_id === storey.id)
						.map((plan) => (
							<details key={plan.id} open={expanded}>
								<summary>
									{plan.code} · {plan.name}
								</summary>
								{units
									.filter((u) => u.floor_plan_id === plan.id)
									.map((unit) => {
										const state = unitCheckState(
											unit.id,
											selected.id,
											assignments
										);
										return (
											<fieldset key={unit.id} className="ml-6">
												<legend>
													<input
														ref={(node) => {
															if (node) node.indeterminate = state === "some";
														}}
														checked={state === "all"}
														type="checkbox"
														aria-label={t("blueprints.scope.allFor", {
															unit: unit.code,
														})}
														onChange={() => {
															onToggleUnit(
																unit.id,
																unitToggleCodes(
																	state,
																	selected.default_scope_codes
																)
															);
														}}
													/>
													{unit.code}
												</legend>
												{SCOPE_CODES.map((code) => {
													const current = assignments.some(
														(a) =>
															a.unit_id === unit.id &&
															a.subcontractor_id === selected.id &&
															a.scope_code === code
													);
													const holders = otherHolders(
														unit.id,
														code,
														selected.id,
														assignments,
														subcontractors
													);
													return (
														<label key={code} className="block">
															<input
																checked={current}
																type="checkbox"
																onChange={(event) => {
																	onToggleItem(
																		unit.id,
																		code,
																		event.target.checked
																	);
																}}
															/>{" "}
															{t("blueprints.scope.item", { code })}
															{holders.length
																? ` · ${t("blueprints.scope.also", { holders: holders.join(", ") })}`
																: ""}
														</label>
													);
												})}
											</fieldset>
										);
									})}
							</details>
						))}
				</details>
			))}
		</section>
	);
};
