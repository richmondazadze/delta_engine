import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MarketingReveal } from "./MarketingReveal";

type Props = {
  id?: string;
  children?: ReactNode;
  className?: string;
  innerClassName?: string;
  kicker?: string;
  title?: string;
  description?: string;
  align?: "left" | "center";
  reveal?: boolean;
};

export function MarketingSection({
  id,
  children,
  className,
  innerClassName,
  kicker,
  title,
  description,
  align = "center",
  reveal = true,
}: Props) {
  const isCenter = align === "center";

  const header =
    kicker || title || description ? (
      reveal ? (
        <MarketingReveal>
          <SectionHeader
            kicker={kicker}
            title={title}
            description={description}
            isCenter={isCenter}
          />
        </MarketingReveal>
      ) : (
        <SectionHeader
          kicker={kicker}
          title={title}
          description={description}
          isCenter={isCenter}
        />
      )
    ) : null;

  const body = (
    <section id={id} className={cn("mk-section", className)}>
      <div className={cn("mk-section-inner", innerClassName)}>
        {header}
        {reveal ? <MarketingReveal delay={0.1}>{children}</MarketingReveal> : children}
      </div>
    </section>
  );

  return body;
}

function SectionHeader({
  kicker,
  title,
  description,
  isCenter,
}: {
  kicker?: string;
  title?: string;
  description?: string;
  isCenter: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-10 md:mb-20",
        isCenter ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
      )}
    >
      {kicker ? <p className="mk-kicker mb-4">{kicker}</p> : null}
      {title ? <h2 className="mk-section-title">{title}</h2> : null}
      {description ? (
        <p className={cn("mk-section-lead", title && "mt-5")}>{description}</p>
      ) : null}
    </div>
  );
}
