import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/Icon";

export function FeatureCard({
  icon,
  title,
  body,
  variant = "default",
}: {
  icon: IconName;
  title: string;
  body: string;
  variant?: "default" | "accent" | "dark";
}) {
  return (
    <article className={`mk-feature mk-feature-${variant}`}>
      <div className="mk-feature-top">
        <div className="mk-feature-icon">
          <Icon name={icon} size={18} />
        </div>
        <h3>{title}</h3>
      </div>
      <p>{body}</p>
    </article>
  );
}

export function PricingCard({
  name,
  price,
  limits,
  features,
  featured,
}: {
  name: string;
  price: number;
  limits: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <article className={`mk-plan${featured ? " featured" : ""}`}>
      {featured && <span className="mk-plan-badge">Most popular</span>}
      <div className="mk-plan-name">{name}</div>
      <div className="mk-plan-price">
        ${price}
        <span>/mo</span>
      </div>
      <div className="mk-plan-limits">{limits}</div>
      <ul>
        {features.map((item) => (
          <li key={item}>
            <Icon name="check" size={14} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Link href="/register" className={`btn btn-block${featured ? " btn-accent" : " btn-ghost"}`}>
        Start free
      </Link>
    </article>
  );
}
