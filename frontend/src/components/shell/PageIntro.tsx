import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Page subtitle row — title lives in the header breadcrumb only. */
export function PageIntro({ description, actions, className, style }: Props) {
  if (!description && !actions) return null;

  return (
    <div className={cn("page-head", className)} style={style}>
      <div className="pt">{description ? <p className="desc">{description}</p> : null}</div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}
