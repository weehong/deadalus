import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FloorPlan, Storey, Unit } from "../data/database";

export type StructureSelection = { kind: "storey" | "floor-plan"; id: string };
type Props = {
	storeys: Array<Storey>;
	floorPlans: Array<FloorPlan>;
	units: Array<Unit>;
	selected?: StructureSelection;
	onAddFloorPlan?: (id: string) => void;
	onAddUnit?: (id: string) => void;
	onSelect: (selection: StructureSelection) => void;
};

export const StructureTree = ({
	storeys,
	floorPlans,
	units,
	selected,
	onAddFloorPlan,
	onAddUnit,
	onSelect,
}: Props) => {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState<Set<string>>(
		() => new Set(storeys.map(({ id }) => id))
	);
	const toggle = (id: string) => {
		setExpanded((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	return (
		<div
			aria-label={t("blueprints.structure")}
			className="space-y-1"
			role="tree"
		>
			{storeys.map((storey) => {
				const plans = floorPlans.filter((plan) => plan.storey_id === storey.id);
				const open = expanded.has(storey.id);
				return (
					<div
						key={storey.id}
						aria-expanded={open}
						aria-selected={selected?.id === storey.id}
						role="treeitem"
					>
						<div className="flex items-center gap-2">
							<button
								type="button"
								aria-label={t(
									open ? "blueprints.tree.collapse" : "blueprints.tree.expand",
									{ name: storey.name }
								)}
								onClick={() => {
									toggle(storey.id);
								}}
							>
								{open ? "−" : "+"}
							</button>
							<button
								aria-current={selected?.id === storey.id ? "true" : undefined}
								type="button"
								onClick={() => {
									onSelect({ kind: "storey", id: storey.id });
								}}
							>
								<small>{t("blueprints.tree.storey")}</small> {storey.name}{" "}
								<span>
									({t("blueprints.tree.planCount", { count: plans.length })})
								</span>
							</button>
							{onAddFloorPlan && (
								<button
									type="button"
									aria-label={t("blueprints.tree.addFloorPlan", {
										name: storey.name,
									})}
									onClick={() => {
										onAddFloorPlan(storey.id);
									}}
								>
									+
								</button>
							)}
						</div>
						{open && (
							<div className="ml-6 space-y-1" role="group">
								{plans.map((plan) => {
									const planUnits = units.filter(
										(unit) => unit.floor_plan_id === plan.id
									);
									const planOpen = expanded.has(plan.id);
									return (
										<div
											key={plan.id}
											aria-expanded={planOpen}
											aria-selected={selected?.id === plan.id}
											role="treeitem"
										>
											<div className="flex items-center gap-2">
												<button
													type="button"
													aria-label={t(
														planOpen
															? "blueprints.tree.collapse"
															: "blueprints.tree.expand",
														{ name: plan.name }
													)}
													onClick={() => {
														toggle(plan.id);
													}}
												>
													{planOpen ? "−" : "+"}
												</button>
												<button
													type="button"
													aria-current={
														selected?.id === plan.id ? "true" : undefined
													}
													onClick={() => {
														onSelect({ kind: "floor-plan", id: plan.id });
													}}
												>
													<small>{t("blueprints.tree.floorPlan")}</small>{" "}
													{plan.name}{" "}
													<span>
														(
														{t("blueprints.tree.unitCount", {
															count: planUnits.length,
														})}
														)
													</span>
												</button>
												{onAddUnit && (
													<button
														type="button"
														aria-label={t("blueprints.tree.addUnit", {
															name: plan.name,
														})}
														onClick={() => {
															onAddUnit(plan.id);
														}}
													>
														+
													</button>
												)}
											</div>
											{planOpen && (
												<div className="ml-8" role="group">
													{planUnits.map((unit) => (
														<div
															key={unit.id}
															aria-selected={false}
															role="treeitem"
														>
															<small>{t("blueprints.tree.unit")}</small>{" "}
															{unit.code}{" "}
															<span>
																(
																{t("blueprints.tree.roomCount", {
																	count: unit.room_tags.length,
																})}
																)
															</span>
														</div>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
