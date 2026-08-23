import type { ReactNode } from "react";
export const Alert = ({ children }: { children: ReactNode }) => <div aria-live="assertive" className="border-l-4 border-signal-500 bg-surface p-3 text-sm" role="alert">{children}</div>;
 
