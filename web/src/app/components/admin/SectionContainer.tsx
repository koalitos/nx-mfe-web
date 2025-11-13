import type { ReactNode } from "react";

type SectionContainerProps = {
  summaryPrefix: string;
  summaryTitle: string;
  summaryDescription: string;
  children: ReactNode;
  className?: string;
};

export const SectionContainer = ({
  summaryPrefix,
  summaryTitle,
  summaryDescription,
  children,
  className = "space-y-4",
}: SectionContainerProps) => (
  <details
    className={`rounded-2xl border border-slate-800 bg-slate-950/40 p-5 ${className}`.trim()}
  >
    <summary className="cursor-pointer list-none rounded-xl border border-slate-800/70 bg-slate-900/70 p-4 focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
      <p className="text-xs uppercase tracking-widest text-slate-400">{summaryPrefix}</p>
      <h3 className="text-xl font-semibold text-white">{summaryTitle}</h3>
      <p className="text-sm text-slate-300">{summaryDescription}</p>
    </summary>
    {children}
  </details>
);
