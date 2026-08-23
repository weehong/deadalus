export type Figure = { label: string; value: string };
export const FigureGrid = ({ figures }: { figures: Array<Figure> }) => <dl className="grid border-y border-current/40" style={{ gridTemplateColumns: `repeat(${figures.length}, minmax(0, 1fr))` }}>{figures.map(({ label, value }) => <div key={label} className="flex flex-col border-r border-current/40 px-4 py-5 last:border-r-0"><dt className="mt-1 text-xs uppercase tracking-widest opacity-75">{label}</dt><dd className="order-first font-heading text-3xl">{value}</dd></div>)}</dl>;
 
