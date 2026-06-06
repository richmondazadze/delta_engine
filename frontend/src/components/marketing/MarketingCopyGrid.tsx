import { cn } from "@/lib/utils";

type Item = {
  title: string;
  body: string;
};

type Props = {
  items: readonly Item[];
  columns?: 2 | 3 | 4;
  className?: string;
};

export function MarketingCopyGrid({ items, columns = 3, className }: Props) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columns === 2 && "md:grid-cols-2 md:gap-8",
        columns === 3 && "md:grid-cols-3 md:gap-8",
        columns === 4 && "sm:grid-cols-2 lg:grid-cols-4 lg:gap-6",
        className,
      )}
    >
      {items.map((item) => (
        <article key={item.title} className="rounded-sm border bg-card p-8">
          <h3 className="text-xl font-semibold tracking-tight md:text-2xl">{item.title}</h3>
          <p className="mk-body mt-4">{item.body}</p>
        </article>
      ))}
    </div>
  );
}

type BannerProps = {
  title: string;
  description?: string;
  className?: string;
};

export function MarketingBanner({ title, description, className }: BannerProps) {
  return (
    <div
      className={cn(
        "rounded-sm border bg-[var(--brand-tint)] px-8 py-10 text-center md:px-12 md:py-14",
        className,
      )}
    >
      <p className="text-xl font-semibold tracking-tight text-[var(--brand-press)] md:text-2xl">
        {title}
      </p>
      {description ? (
        <p className="mk-body mx-auto mt-4 max-w-2xl text-[var(--brand-press)]/80">
          {description}
        </p>
      ) : null}
    </div>
  );
}
