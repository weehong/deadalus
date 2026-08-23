import type { ReactNode } from "react";
export const SplitLayout = ({ aside, children }: { aside: ReactNode; children: ReactNode }) => <main className="grid min-h-screen grid-cols-1 md:grid-cols-[1.1fr_0.9fr]"><aside>{aside}</aside><section className="flex items-center justify-center p-6 md:p-12">{children}</section></main>;
 
