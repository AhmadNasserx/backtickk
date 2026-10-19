// Server Component: this template gives each route its own keyed wrapper, so `.page-in` replays on every navigation. No client JS.
// A plain block div with no transform after the animation: sticky, fixed and layout behave as they did without it.
import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-in">{children}</div>;
}
