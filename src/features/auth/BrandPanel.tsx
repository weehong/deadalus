import { FigureGrid, type Figure } from "@/components/ui/FigureGrid";
import { Logo } from "@/components/ui/Logo";
type BrandPanelProps = { blurb: string; figures: Array<Figure>; headline: string; kicker: string };
export const BrandPanel = ({ blurb, figures, headline, kicker }: BrandPanelProps) => <div className="flex h-full min-h-[24rem] flex-col justify-between bg-steel-900 p-8 text-canvas md:p-14"><Logo size="large" /><div className="my-12 max-w-xl"><p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel-100">{kicker}</p><h1 className="font-heading text-5xl leading-none md:text-7xl">{headline}</h1><p className="mt-6 max-w-lg text-steel-100">{blurb}</p></div><FigureGrid figures={figures} /></div>;
 
